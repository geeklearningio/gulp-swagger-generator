"use strict";
var through = require('through2');
var diagnostics = require('./diagnostics');
var gutil = require('gulp-util');
var nodeSwaggerGenerator = require('node-swagger-generator');
var GulpSink = (function () {
    function GulpSink(context) {
        this.context = context;
    }
    GulpSink.prototype.push = function (name, content) {
        var file = new gutil.File({
            cwd: "",
            base: "",
            path: name,
            contents: new Buffer(content, 'utf8')
        });
        this.context.push(file);
    };
    GulpSink.prototype.complete = function () {
    };
    return GulpSink;
}());
function swaggerGenerator(options) {
    return through.obj(function (file, enc, cb) {
        var through2Context = this;
        if (file.isStream()) {
            throw diagnostics.newPluginError('Streaming not supported');
        }
        if (file.isNull()) {
            throw diagnostics.newPluginError('A description file is required');
        }
        if (file.isBuffer()) {
            nodeSwaggerGenerator.generateFromJsonOrYaml(file.history.pop(), options, new GulpSink(through2Context))
                .catch(function (err) { return cb(err); })
                .then(function () { return cb(); });
        }
    });
}
module.exports = swaggerGenerator;
