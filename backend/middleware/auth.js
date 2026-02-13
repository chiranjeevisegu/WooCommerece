/**
 * Authentication Middleware
 * Implements API Key authentication for securing endpoints
 */

class AuthMiddleware {
    /**
     * Authenticate requests using API key from headers
     */
    authenticateAPIKey(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        const validApiKey = process.env.API_KEY || 'dev-api-key-12345';

        if (!apiKey) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'API key is required. Please provide X-API-Key header.'
            });
        }

        if (apiKey !== validApiKey) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API key provided.'
            });
        }

        // API key is valid, proceed to next middleware
        next();
    }

    /**
     * Optional authentication - allows both authenticated and unauthenticated requests
     * Sets req.authenticated = true if valid API key provided
     */
    optionalAuth(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        const validApiKey = process.env.API_KEY || 'dev-api-key-12345';

        req.authenticated = apiKey === validApiKey;
        next();
    }

    /**
     * Extract user identifier from request (IP address or API key)
     * Used for rate limiting and audit logging
     */
    getUserIdentifier(req) {
        const apiKey = req.headers['x-api-key'];
        if (apiKey) {
            // Hash API key for privacy
            return `key_${apiKey.substring(0, 8)}`;
        }

        // Fallback to IP address
        return req.ip || req.connection.remoteAddress || 'unknown';
    }
}

module.exports = new AuthMiddleware();
