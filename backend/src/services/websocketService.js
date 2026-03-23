/**
 * WebSocket Service
 * Provides real-time queue updates to connected clients (operator panels, TV displays).
 *
 * Usage in app.js:
 *   const { createWebSocketServer } = require('./services/websocketService');
 *   const server = app.listen(PORT, ...);
 *   createWebSocketServer(server);
 *
 * Usage in controllers (to broadcast updates):
 *   const { broadcast } = require('../services/websocketService');
 *   broadcast('queue:updated', { ... });
 */

const WebSocket = require('ws');

let wss = null;

/**
 * Create a WebSocket server attached to the HTTP server.
 * Clients can connect to ws://host:port
 */
function createWebSocketServer(server) {
    wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', (ws) => {
        console.log('[WS] Client connected. Total:', wss.clients.size);

        // Send a welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to queue updates.'
        }));

        ws.on('close', () => {
            console.log('[WS] Client disconnected. Total:', wss.clients.size);
        });

        ws.on('error', (error) => {
            console.error('[WS] Error:', error.message);
        });
    });

    console.log('[WS] WebSocket server started on /ws');
    return wss;
}

/**
 * Broadcast a message to all connected clients.
 * @param {string} type - Event type, e.g. 'queue:called', 'queue:updated'
 * @param {object} data - The payload to send
 */
function broadcast(type, data) {
    if (!wss) return;

    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

module.exports = { createWebSocketServer, broadcast };
