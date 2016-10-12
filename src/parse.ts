/// <reference path="../typings.d.ts" />

import Promise = require('bluebird');
import parser = require("swagger-parser");
import gutil = require("gulp-util");
import diagnostics = require('./diagnostics');

export interface IParsedSwagger {
    api: parser.IApi,
    metadata: parser.IMetadata
}

export function parse(file: string): Promise<IParsedSwagger> {
    var deferral = Promise.defer<IParsedSwagger>();
    parser.dereference(file,{
        parseYaml : true,
        dereference$Refs : false,
        dereferenceInternal$Refs :  false,
        resolve$Refs : true,
        resolveExternal$Refs : true,
        validateSchema : true,
        strictValidation : false
        }, function parseSchema(error: Error,  api: parser.IApi, metadata: parser.IMetadata)  {
        if (error) {
            diagnostics.error(error.message);
            deferral.reject(error);
        } else {
            gutil.log(api.info.title);
            //gutil.log(JSON.stringify(metadata));
            //gutil.log(JSON.stringify(api));
            deferral.resolve({
                api: api,
                metadata: metadata
            });
        }
    });
    return deferral.promise
}
