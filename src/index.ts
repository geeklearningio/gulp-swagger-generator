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
import swaggerGeneratorDef = require('./swaggerGenerator');
let join = Promise.join;




function swaggerGenerator(options: swaggerGeneratorDef.ISwaggerGeneratorOptions) {
    registerHelpers();

    if (!options.clientName) {
        options.clientName = 'ApiClient';
    }

    if (!options.renameDefinitions) {
        options.renameDefinitions = {};
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
                .then((result): swaggerGeneratorDef.Context => {
                    return {options: options, api: result, through: through2Context};
                })
                .then(loadTemplateFiles)
                .then(loadLanguageOptions)
                .then(wrapHandleBarsContext)
                .then(applyTemplates)
                .catch((err)=> cb(err))
                .then(() => cb());
        }
    })
}

function wrapHandleBarsContext(context: swaggerGeneratorDef.Context): Promise<swaggerGeneratorDef.Context> {

    context.handlebarsContext = {
        api: contextBuilder.buildHandlebarsContext(context.api, context.options.renameDefinitions),
        options: context.options.templateOptions,
        isSingleFile: context.options.singleFile,
        clientName: context.options.clientName
    };

    var concreteTypeMapper = require('./' + context.options.template.split('-')[0] + 'TypeMapper');
    var typeMapper = concreteTypeMapper.createTypeMapper(context);
    contextBuilder.setTypeMapper(typeMapper);

    return Promise.resolve(context);
}

function applyTemplates(context: swaggerGeneratorDef.Context): Promise<swaggerGeneratorDef.Context> {
    let templates: string[] = [];
    if(context.options.singleFile) {
        templates.push('SingleFile');
    } else {
        templates.push('Definition');
        if(context.options.templateOptions.generateInterface) {
            templates.push('Interface');
        }
        if(context.options.templateOptions.arguments && context.options.templateOptions.arguments.asInterface) {
            templates.push('ArgumentInterface');
        }
        templates.push('Client');
        if(context.options.templateOptions.generateMock) {
            templates.push('Mock');
        }
    }
    for(let template of templates) {
        gutil.log(template);
        let fileName = context.options.singleFile ? context.options.clientName : template;
        var serviceClientFile = new gutil.File({
            cwd: "",
            base: "",
            path: fileName + context.languageOptions.fileExtension,
            contents: new Buffer(context.templates[template](context.handlebarsContext), 'utf8')
        });
        context.through.push(serviceClientFile);
    }
    return Promise.resolve(context);
}


function loadTemplateFiles(context: swaggerGeneratorDef.Context): Promise<swaggerGeneratorDef.Context> {
    var templateDir: string = context.options.templatePath ?
        context.options.templatePath : path.join(__dirname, './templates/', context.options.template.replace(/-/g, '/'));

    gutil.log(templateDir);

    var templates: {[name: string]: HandlebarsTemplateDelegate} = {};
    var deferral = Promise.defer<swaggerGeneratorDef.Context>();

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

                        templates[fileName] = handlebars.compile(content, {noEscape: true});
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

function loadLanguageOptions(context: swaggerGeneratorDef.Context): Promise<swaggerGeneratorDef.Context> {
    var deferral = Promise.defer<swaggerGeneratorDef.Context>();
    var languageDir: string = context.options.templatePath ?
        context.options.templatePath : path.join(__dirname, './templates/', context.options.template.split(/-/g)[0]);

    fs.readFile(path.join(languageDir, 'languageOptions.json'), 'utf8', function (err: any, content: string) {
        if (!err) {
            context.languageOptions = JSON.parse(content);
            deferral.resolve(context);
        } else {
            deferral.reject(err);
        }
    });
    return deferral.promise;
}

function registerHelpers() {

    handlebars.registerHelper('json', (context: any) => {
        return JSON.stringify(context, null, 4);
    });

    handlebars.registerHelper('lowerCase', (context: string) => {
        return context.toLowerCase();
    });

    handlebars.registerHelper('upperCase', (context: string) => {
        return context.toUpperCase();
    });

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

    handlebars.registerHelper('pascalCaseOverwriteCasing', (context: any) => {
        var contextType = typeof context;
        if (contextType === 'string') {
            context = context.split(/[^\w]/g);
        }

        return pascalCase(<string[]>context);
    });

    gutil.log(gutil.colors.cyan('pascalCase registered'));

    handlebars.registerHelper('getType', function (context: any, options: any): any {
        var mapper = contextBuilder.getTypeMapper();
        if (mapper) {
            return options.fn(mapper.getType(context));
        } else {
            return options.fn({});
        }
    });

    handlebars.registerHelper('mapLookup', function (map: any, lookupValue: string, options: any): any {
        if (map) {
            return options.fn(map[lookupValue]);
        }
        return options.fn({});
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


function pascalCase(words: string[]): string {
    return words.map((x: string, index: number)=> {
        return firstLetterUpperCase(x);
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
