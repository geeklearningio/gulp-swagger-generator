"use strict";
var Promise = require('bluebird');
var parser = require("swagger-parser");
var gutil = require("gulp-util");
var diagnostics = require('./diagnostics');
function parse(file) {
    var deferral = Promise.defer();
    parser.parse(file, {
        parseYaml: true,
        dereference$Refs: false,
        dereferenceInternal$Refs: false,
        resolve$Refs: true,
        resolveExternal$Refs: true,
        validateSchema: true,
        strictValidation: false
    }, function parseSchema(error, api, metadata) {
        if (error) {
            diagnostics.error(error.message);
            deferral.reject(error);
        }
        else {
            gutil.log(api.info.title);
            deferral.resolve({
                api: api,
                metadata: metadata
            });
        }
    });
    return deferral.promise;
}
exports.parse = parse;
