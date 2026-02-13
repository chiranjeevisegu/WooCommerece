import { useState, useEffect } from 'react';
import api from './api';

function App() {
    const [stores, setStores] = useState([]);
    const [metrics, setMetrics] = useState({ total: 0, active: 0, provisioning: 0, failed: 0 });
    const [enhancedMetrics, setEnhancedMetrics] = useState(null);
    const [globalActivity, setGlobalActivity] = useState([]);
    const [failures, setFailures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchStores = async () => {
        try {
            const data = await api.getStores();
            setStores(data);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMetrics = async () => {
        try {
            const data = await api.getMetrics();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        }
    };

    const fetchEnhancedMetrics = async () => {
        try {
            const data = await api.getEnhancedMetrics();
            setEnhancedMetrics(data);
        } catch (error) {
            console.error('Failed to fetch enhanced metrics:', error);
        }
    };

    const fetchGlobalActivity = async () => {
        try {
            const data = await api.getGlobalActivity(30);
            setGlobalActivity(data);
        } catch (error) {
            console.error('Failed to fetch global activity:', error);
        }
    };

    const fetchFailures = async () => {
        try {
            const data = await api.getFailures(5);
            setFailures(data);
        } catch (error) {
            console.error('Failed to fetch failures:', error);
        }
    };

    useEffect(() => {
        fetchStores();
        fetchMetrics();
        fetchEnhancedMetrics();
        fetchGlobalActivity();
        fetchFailures();

        const interval = setInterval(() => {
            fetchStores();
            fetchMetrics();
            fetchEnhancedMetrics();
            fetchGlobalActivity();
            fetchFailures();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Store Platform</h1>
                            <p className="text-slate-600 mt-1">Kubernetes-powered WooCommerce provisioning</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-md font-medium text-sm transition-colors shadow-sm"
                        >
                            + Create Store
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <MetricCard label="Total Stores" value={metrics.total} color="slate" />
                    <MetricCard label="Active" value={metrics.active} color="green" />
                    <MetricCard label="Provisioning" value={metrics.provisioning} color="blue" />
                    <MetricCard label="Failed" value={metrics.failed} color="red" />
                </div>

                {/* Enhanced Metrics */}
                {enhancedMetrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                            <div className="text-sm font-medium text-slate-600 mb-2">Avg Provisioning Time</div>
                            <div className="text-2xl font-bold text-slate-900">
                                {enhancedMetrics.provisioning_stats.avg_duration_seconds > 0
                                    ? `${Math.round(enhancedMetrics.provisioning_stats.avg_duration_seconds / 60)} min`
                                    : 'N/A'
                                }
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Range: {Math.round(enhancedMetrics.provisioning_stats.min_duration_seconds / 60)}-{Math.round(enhancedMetrics.provisioning_stats.max_duration_seconds / 60)} min
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                            <div className="text-sm font-medium text-slate-600 mb-2">Failure Rate</div>
                            <div className="text-2xl font-bold text-red-600">{enhancedMetrics.failure_rate}%</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {enhancedMetrics.recent_failures_24h} failures in last 24h
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                            <div className="text-sm font-medium text-slate-600 mb-2">Success Rate</div>
                            <div className="text-2xl font-bold text-emerald-600">{(100 - enhancedMetrics.failure_rate).toFixed(1)}%</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Based on {enhancedMetrics.total} total stores
                            </div>
                        </div>
                    </div>
                )}

                {/* Observability Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Global Activity Log */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="text-blue-500">📊</span> Global Activity Log
                        </h3>
                        <GlobalActivityLog activities={globalActivity} />
                    </div>

                    {/* Recent Failures */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="text-red-500">⚠️</span> Recent Failures
                        </h3>
                        <FailureReport failures={failures} />
                    </div>
                </div>

                {/* Stores List */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Stores ({stores.length})</h2>
                </div>

                {loading ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
                        <div className="text-slate-400 mb-2">Loading stores...</div>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No stores yet</h3>
                        <p className="text-slate-600 mb-6 text-sm">Create your first WooCommerce store to get started</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-md font-medium text-sm transition-colors"
                        >
                            Create Store
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map(store => (
                            <StoreCard
                                key={store.store_id}
                                store={store}
                                onDelete={() => setDeleteTarget(store)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && <CreateStoreModal onClose={() => setShowCreateModal(false)} onSuccess={fetchStores} />}
            {deleteTarget && <DeleteModal store={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={fetchStores} />}
        </div>
    );
}

function MetricCard({ label, value, color = 'slate' }) {
    const colorClasses = {
        slate: 'bg-slate-50 border-slate-200 text-slate-900',
        green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        blue: 'bg-blue-50 border-blue-200 text-blue-900',
        red: 'bg-red-50 border-red-200 text-red-900'
    };

    return (
        <div className={`${colorClasses[color]} rounded-lg border p-6 shadow-sm`}>
            <div className="text-sm font-medium opacity-75 mb-1">{label}</div>
            <div className="text-3xl font-bold">{value}</div>
        </div>
    );
}

function StoreCard({ store, onDelete }) {
    const statusConfig = {
        provisioning: { color: 'blue', badge: 'Provisioning', showProgress: true },
        deploying: { color: 'blue', badge: 'Deploying', showProgress: true },
        creating: { color: 'blue', badge: 'Creating', showProgress: true },
        ready: { color: 'green', badge: 'Ready', showProgress: false },
        failed: { color: 'red', badge: 'Failed', showProgress: false },
        deleting: { color: 'slate', badge: 'Deleting', showProgress: false }
    };

    const config = statusConfig[store.status] || statusConfig.provisioning;
    const badgeColors = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        red: 'bg-red-100 text-red-700 border-red-200',
        slate: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{store.name}</h3>
                    <p className="text-sm text-slate-600">WooCommerce Store</p>
                </div>
                <span className={`px-3 py-1 rounded-md text-xs font-medium border ${badgeColors[config.color]}`}>
                    {config.badge}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="text-sm">
                    <span className="text-slate-500">Store ID:</span>
                    <code className="ml-2 text-slate-700 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{store.store_id}</code>
                </div>
                <div className="text-sm">
                    <span className="text-slate-500">Created:</span>
                    <span className="ml-2 text-slate-700">{new Date(store.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    })}</span>
                </div>
                {store.url && store.status === 'ready' && (
                    <div className="text-sm">
                        <span className="text-slate-500">URL:</span>
                        <a href={store.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:text-blue-700 hover:underline">
                            {store.url}
                        </a>
                    </div>
                )}
            </div>

            {store.status === 'failed' && store.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {store.error}
                </div>
            )}

            {config.showProgress && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">Provisioning...</span>
                        <span className="text-slate-500">Please wait</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                </div>
            )}

            {/* Activity Log */}
            {(store.status === 'provisioning' || store.status === 'deploying' || store.status === 'creating') && (
                <div className="mb-4">
                    <h4 className="text-xs font-medium mb-2 text-slate-700">Activity Log</h4>
                    <ActivityLog storeId={store.store_id} />
                </div>
            )}

            <div className="flex gap-2">
                {store.status === 'ready' && (
                    <>
                        <a
                            href={store.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-center font-medium text-sm transition-colors"
                        >
                            Open Store
                        </a>
                        <a
                            href={store.admin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Login: admin / Admin@123"
                            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-center font-medium text-sm transition-colors"
                        >
                            Admin
                        </a>
                    </>
                )}
                <button
                    onClick={onDelete}
                    className="px-4 py-2 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 rounded-md transition-colors text-sm font-medium border border-slate-300 hover:border-red-300"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

function CreateStoreModal({ onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('woocommerce');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.createStore({ name, type });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create store');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Create New Store</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Store Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Shop"
                            autoFocus
                            className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
                        />
                    </div>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Store'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteModal({ store, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');

        try {
            await api.deleteStore(store.store_id);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete store');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Delete Store</h2>
                <p className="text-slate-600 mb-6">
                    Are you sure you want to delete <strong>{store.name}</strong>? This action cannot be undone.
                </p>
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {error}
                    </div>
                )}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Deleting...' : 'Delete Store'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ActivityLog({ storeId }) {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await api.getStoreEvents(storeId);
                setEvents(data);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            }
        };

        fetchEvents();
        const interval = setInterval(fetchEvents, 3000);
        return () => clearInterval(interval);
    }, [storeId]);

    if (events.length === 0) {
        return <div className="text-xs text-slate-500">No activity yet...</div>;
    }

    return (
        <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.slice(0, 10).map((event, index) => (
                <div key={index} className="text-xs flex items-start gap-2 p-2 bg-slate-800/50 rounded">
                    <span className="text-slate-500">{new Date(event.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    <span className={`font-semibold ${event.severity === 'error' ? 'text-red-400' : event.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {event.event_type}:
                    </span>
                    <span className="text-slate-300 flex-1">{event.message}</span>
                </div>
            ))}
        </div>
    );
}

function GlobalActivityLog({ activities }) {
    if (activities.length === 0) {
        return <div className="text-sm text-slate-500 text-center py-8">No recent activity</div>;
    }

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {activities.map((activity, index) => (
                <div key={index} className="text-xs flex items-start gap-2 p-3 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors">
                    <div className="flex-shrink-0 w-16 text-slate-500">
                        {new Date(activity.created_at).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-slate-700">{activity.store_name || activity.store_id}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${activity.severity === 'error' ? 'bg-red-100 text-red-700' :
                                    activity.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {activity.event_type}
                            </span>
                            <span className="text-slate-600">{activity.message}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function FailureReport({ failures }) {
    if (failures.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-sm text-slate-600">No recent failures</div>
                <div className="text-xs text-slate-500 mt-1">All systems operational</div>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {failures.map((failure, index) => (
                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="font-semibold text-red-900">{failure.name}</div>
                            <div className="text-xs text-red-600 font-mono mt-1">{failure.store_id}</div>
                        </div>
                        <div className="text-xs text-red-600">
                            {new Date(failure.updated_at).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                    <div className="text-sm text-red-800 mb-2">
                        <strong>Reason:</strong> {failure.status_message || failure.error || 'Unknown error'}
                    </div>
                    {failure.duration_seconds && (
                        <div className="text-xs text-red-600">
                            Failed after {Math.round(failure.duration_seconds / 60)} minutes
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default App;
