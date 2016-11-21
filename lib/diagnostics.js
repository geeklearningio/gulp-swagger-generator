"use strict";
var gutil = require('gulp-util');
exports.PLUGIN_NAME = 'gulp-swagger-generator';
function newPluginError(message) {
    return new gutil.PluginError(exports.PLUGIN_NAME, message);
}
exports.newPluginError = newPluginError;
function error(message) {
    gutil.log(gutil.colors.red(exports.PLUGIN_NAME + ' ' + message));
}
exports.error = error;
