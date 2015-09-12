/// <reference path="../typings.d.ts" />
import Promise = require('bluebird');
import parser = require("swagger-parser");
export interface IParsedSwagger {
    api: parser.IApi;
    metadata: parser.IMetadata;
}
export declare function parse(file: string): Promise<IParsedSwagger>;
