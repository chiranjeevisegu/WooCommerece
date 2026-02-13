/**
 * API Configuration
 * Centralized API client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = {
    // Stores
    getStores: async () => {
        const response = await fetch(`${API_BASE_URL}/api/stores`);
        if (!response.ok) throw new Error('Failed to fetch stores');
        return response.json();
    },

    getStore: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/stores/${id}`);
        if (!response.ok) throw new Error('Failed to fetch store');
        return response.json();
    },

    createStore: async (data) => {
        const response = await fetch(`${API_BASE_URL}/api/stores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw { response: { data: error } };
        }
        return response.json();
    },

    deleteStore: async (id) => {
        const response = await fetch(`${API_BASE_URL}/api/stores/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete store');
        return response.json();
    },

    // Metrics
    getMetrics: async () => {
        const response = await fetch(`${API_BASE_URL}/api/metrics`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        return response.json();
    },

    // Store Events
    getStoreEvents: async (storeId) => {
        const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/events`);
        if (!response.ok) throw new Error('Failed to fetch events');
        return response.json();
    },

    // Observability
    getGlobalActivity: async (limit = 50) => {
        const response = await fetch(`${API_BASE_URL}/api/observability/activity?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch activity log');
        return response.json();
    },

    getEnhancedMetrics: async () => {
        const response = await fetch(`${API_BASE_URL}/api/observability/metrics/enhanced`);
        if (!response.ok) throw new Error('Failed to fetch enhanced metrics');
        return response.json();
    },

    getFailures: async (limit = 10) => {
        const response = await fetch(`${API_BASE_URL}/api/observability/failures?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch failures');
        return response.json();
    },

    getTimeline: async () => {
        const response = await fetch(`${API_BASE_URL}/api/observability/timeline`);
        if (!response.ok) throw new Error('Failed to fetch timeline');
        return response.json();
    }
};

export default api;
