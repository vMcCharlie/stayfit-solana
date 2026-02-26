if (typeof WebSocket === 'undefined') {
    // Check if global WebSocket exists (e.g. in React Native)
    if (global.WebSocket) {
        module.exports = global.WebSocket;
    } else {
        // Fallback or error if neither exists (shouldn't happen in RN)
        console.warn('WebSocket is not defined in this environment');
        module.exports = {};
    }
} else {
    module.exports = WebSocket;
}

// Add necessary properties that ws might expect if accessed directly
module.exports.Server = function () {
    throw new Error('ws.Server is not supported in React Native');
};
