/// <reference path="../typings.d.ts" />

import through = require('through2');
import diagnostics = require('./diagnostics');
import parse = require('./parse');
import swagger = require('swagger-parser');
import Promise = require('bluebird');
import fs = require('fs');
import async = require('async');
import path = require('path');
import handlebars = require('handlebars');
import contextBuilder = require('./contextBuilder');
import gutil = require('gulp-util');
import _ = require('lodash');

let join = Promise.join;

module swaggerGenerator {

    export interface ISwaggerGeneratorOptions {
        clientName?: string;
        singleFile?: boolean;
        template: string;
        templatePath?: string;
        templateOptions: any;
        handlerbarsExtensions?: any
    }

    export interface Context {
        options: ISwaggerGeneratorOptions,
        api?: parse.IParsedSwagger,
        templates?: {[name: string]: HandlebarsTemplateDelegate}
        handlebarsContext?: any,
        through: any;
    }
}


function swaggerGenerator(options: swaggerGenerator.ISwaggerGeneratorOptions) {
    registerHelpers();

    if (!options.clientName) {
        options.clientName = 'ApiClient';
    }
    return through.obj(function (file: any, enc: any, cb: Function) {
        let through2Context = this;

        if (file.isStream()) {
            throw diagnostics.newPluginError('Streaming not supported');
        }

        if (file.isNull()) {
            throw diagnostics.newPluginError('A description file is required');
        }

        if (file.isBuffer()) {

            parse.parse(file.history[0])
                .then((result): swaggerGenerator.Context => {
                    return {options: options, api: result, through: through2Context};
                })
                .then(loadTemplateFiles)
                .then(wrapHandleBarsContext)
                .then(applyTemplates);
        }
    })
}

function wrapHandleBarsContext(context: swaggerGenerator.Context): Promise<swaggerGenerator.Context> {

    context.handlebarsContext = {
        api: contextBuilder.buildHandlebarsContext(context.api),
        options: context.options.templateOptions,
        isSingleFile: context.options.singleFile
    };

    var concreteTypeMapper = require('./' + context.options.template.split('-')[0] + 'TypeMapper');
    var typeMapper = concreteTypeMapper.createTypeMapper(context);
    contextBuilder.setTypeMapper(typeMapper);

    return Promise.resolve(context);
}

function applyTemplates(context: swaggerGenerator.Context): Promise<swaggerGenerator.Context> {

    if (context.options.singleFile) {
        let singleFileTemplate = context.templates['SingleFile'];
        gutil.log(JSON.stringify(Object.keys(context.templates)));
        var serviceClientFile = new gutil.File({
            cwd: "",
            base: "",
            path: context.options.clientName + '.ts',
            contents: new Buffer(singleFileTemplate(context.handlebarsContext), 'utf8')
        });
        context.through.push(serviceClientFile);
    }

    return Promise.resolve(context);
}


function loadTemplateFiles(context: swaggerGenerator.Context): Promise<swaggerGenerator.Context> {
    var templateDir: string = context.options.templatePath ?
        context.options.templatePath : path.join(__dirname, './templates/', context.options.template.replace(/-/g, '/'));

    gutil.log(templateDir);

    var templates: {[name: string]: HandlebarsTemplateDelegate} = {};
    var deferral = Promise.defer<swaggerGenerator.Context>();

    fs.readdir(templateDir, (err: NodeJS.ErrnoException, files: string[]) => {
        gutil.log(JSON.stringify(files));
        async.eachSeries(files,
            function (templateFilePath: string, cb: Function) {
                gutil.log(templateFilePath);
                fs.readFile(path.join(templateDir, templateFilePath), 'utf8', function (err: any, content: string) {
                    if (!err) {
                        // Calling cb makes it go to the next item.
                        var fileName = path.basename(templateFilePath, path.extname(templateFilePath));
                        handlebars.registerPartial(fileName, content);

                        templates[fileName] = handlebars.compile(content);
                    } else {
                        diagnostics.error(err);
                    }
                    cb(err);
                });
            },
            // Final callback after each item has been iterated over.
            function (err: any) {
                if (err) {
                    diagnostics.error(err);
                    deferral.reject(err);
                } else {
                    context.templates = templates;
                    deferral.resolve(context);
                }
            }
        );
    });
    return deferral.promise;
}


function registerHelpers() {
    handlebars.registerHelper('camlCase', (context: any) => {
        var contextType = typeof context;
        if (contextType === 'string') {
            context = context.split(/[^\w]/g);
        }

        return camlCasePreserve(<string[]>context);
    });
    gutil.log(gutil.colors.cyan('camlCase registered'));

    handlebars.registerHelper('pascalCase', (context: any) => {
        var contextType = typeof context;
        if (contextType === 'string') {
            context = context.split(/[^\w]/g);
        }

        return pascalCasePreserve(<string[]>context);
    });
    gutil.log(gutil.colors.cyan('pascalCase registered'));

    handlebars.registerHelper('getType', (context: any, options: any) => {
        var mapper = contextBuilder.getTypeMapper();
        if (mapper)
        {
            return mapper.getType(context).name;
        } else {
            return {}
        }
    });
    gutil.log(gutil.colors.cyan('getType registered'));
}


function camlCasePreserve(words: string[]): string {
    return words.map((x: string, index: number)=> {
        if (index) {
            return firstLetterUpperCasePreserveCasing(x);
        } else {
            return firstLetterLowerCasePreserveCasing(x);
        }
    }).join('');
}

function pascalCasePreserve(words: string[]): string {
    return words.map((x: string, index: number)=> {
        return firstLetterUpperCasePreserveCasing(x);
    }).join('');
}

function firstLetterUpperCase(str: string): string {
    return (<string>str).substring(0, 1).toUpperCase() + (<string>str).substring(1).toLowerCase();
}

function firstLetterUpperCasePreserveCasing(str: string): string {
    return (<string>str).substring(0, 1).toUpperCase() + (<string>str).substring(1);
}

function firstLetterLowerCasePreserveCasing(str: string): string {
    return (<string>str).substring(0, 1).toLowerCase() + (<string>str).substring(1);
}

export = swaggerGenerator;
