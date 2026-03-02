const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Support .mjs files
config.resolver.sourceExts.push('mjs');

// Override resolution to alias 'ws' to the shim
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'ws') {
        // Redirect 'ws' to our shim
        return {
            type: 'sourceFile',
            filePath: path.resolve(__dirname, 'src/lib/ws-shim.js'),
        };
    }

    // Chain to the standard Metro resolver
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
