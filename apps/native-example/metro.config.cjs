const { getDefaultConfig } = require('expo/metro-config');

/** Expo 55 already watches the monorepo workspace graph. */
module.exports = getDefaultConfig(__dirname);
