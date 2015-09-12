/// <reference path="../typings.d.ts" />
import parse = require('./parse');
declare module swaggerGenerator {
    interface ISwaggerGeneratorOptions {
        clientName?: string;
        singleFile?: boolean;
        template: string;
        templatePath?: string;
        templateOptions: any;
        handlerbarsExtensions?: any;
    }
    interface Context {
        options: ISwaggerGeneratorOptions;
        api?: parse.IParsedSwagger;
        templates?: {
            [name: string]: HandlebarsTemplateDelegate;
        };
        handlebarsContext?: any;
        through: any;
    }
}
declare function swaggerGenerator(options: swaggerGenerator.ISwaggerGeneratorOptions): NodeJS.ReadWriteStream;
export = swaggerGenerator;
