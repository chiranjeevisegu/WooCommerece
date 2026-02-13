/**
 * Rate Limiting Middleware
 * Implements multiple rate limiters for different endpoints
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Applies to all API endpoints
 */
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Max 100 requests per minute per IP
    message: {
        error: 'Too Many Requests',
        message: 'You have exceeded the 100 requests per minute limit. Please try again later.',
        retryAfter: '60 seconds'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'You have exceeded the 100 requests per minute limit.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Store creation rate limiter
 * Stricter limits for resource-intensive operations
 */
const createStoreLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 store creations per 15 minutes per IP
    message: {
        error: 'Store Creation Limit Exceeded',
        message: 'You can only create 5 stores per 15 minutes. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all attempts, even failed ones
    handler: (req, res) => {
        res.status(429).json({
            error: 'Store Creation Limit Exceeded',
            message: 'You can only create 5 stores per 15 minutes.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
            limit: 5,
            window: '15 minutes'
        });
    }
});

/**
 * Store deletion rate limiter
 * Prevent mass deletion attacks
 */
const deleteStoreLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Max 10 deletions per 5 minutes per IP
    message: {
        error: 'Deletion Limit Exceeded',
        message: 'You can only delete 10 stores per 5 minutes.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Deletion Limit Exceeded',
            message: 'You can only delete 10 stores per 5 minutes.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

/**
 * Strict rate limiter for unauthenticated requests
 * Much lower limits for requests without API key
 */
const unauthenticatedLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Max 20 requests per 5 minutes for unauthenticated users
    message: {
        error: 'Rate Limit Exceeded',
        message: 'Unauthenticated requests are limited to 20 per 5 minutes. Please provide an API key for higher limits.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting if valid API key provided
        const apiKey = req.headers['x-api-key'];
        const validApiKey = process.env.API_KEY || 'dev-api-key-12345';
        return apiKey === validApiKey;
    }
});

module.exports = {
    apiLimiter,
    createStoreLimiter,
    deleteStoreLimiter,
    unauthenticatedLimiter
};
