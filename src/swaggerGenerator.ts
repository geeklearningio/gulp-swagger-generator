/// <reference path="../typings.d.ts" />

import through = require('through2');
import diagnostics = require('./diagnostics');
import parse = require('./parse');

module swaggerGenerator {

    export interface ISwaggerGeneratorOptions {
        clientName?: string;
        singleFile?: boolean;
        template: string;
        templatePath?: string;
        templateOptions: any;
        handlerbarsExtensions?: any
        renameDefinitions?: {[from: string]: string}
    }

    export interface Context {
        options: ISwaggerGeneratorOptions,
        api?: parse.IParsedSwagger,
        templates?: {[name: string]: HandlebarsTemplateDelegate}
        handlebarsContext?: any,
        through: any;
        languageOptions?: any;
    }
}

export = swaggerGenerator;
