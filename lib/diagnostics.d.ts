/// <reference path="../typings.d.ts" />
import gutil = require('gulp-util');
export declare let PLUGIN_NAME: string;
export declare function newPluginError(message: string): gutil.PluginError;
export declare function error(message: string): void;
