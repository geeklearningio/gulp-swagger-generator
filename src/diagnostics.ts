import gutil = require('gulp-util');


export let PLUGIN_NAME = 'gulp-swagger-generator';


export function newPluginError(message: string) {
    return new gutil.PluginError(PLUGIN_NAME, message);
}

export function error(message: string) {
    gutil.log(gutil.colors.red(PLUGIN_NAME + ' ' + message));
}

