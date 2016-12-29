import through = require('through2');
import diagnostics = require('./diagnostics');
import Promise = require('bluebird');
import gutil = require('gulp-util');
import nodeSwaggerGenerator = require('node-swagger-generator');

class GulpSink implements nodeSwaggerGenerator.ISink {
    constructor(private context: any){

    }

    push(name: string, content: string): void {
        var file = new gutil.File({
            cwd: "",
            base: "",
            path: name,
            contents: new Buffer(content, 'utf8')
        });
        this.context.push(file);
    }
    complete(): void {

    }
}


function swaggerGenerator(options: nodeSwaggerGenerator.ISwaggerGeneratorOptions, templateStores?: string[]) {
    return through.obj(function (file: any, enc: any, cb: Function) {
        let through2Context = this;

        if (file.isStream()) {
            throw diagnostics.newPluginError('Streaming not supported');
        }

        if (file.isNull()) {
            throw diagnostics.newPluginError('A description file is required');
        }

        if (file.isBuffer()) {
            nodeSwaggerGenerator.generateFromJsonOrYaml(file.history.pop(), options, new GulpSink(through2Context), templateStores)
            .catch((err: any) => cb(err))
            .then(() => cb());
        }
    })
}

export = swaggerGenerator;
