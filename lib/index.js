var through = require('through2');
var diagnostics = require('./diagnostics');
var parse = require('./parse');
var Promise = require('bluebird');
var fs = require('fs');
var async = require('async');
var path = require('path');
var handlebars = require('handlebars');
var contextBuilder = require('./contextBuilder');
var gutil = require('gulp-util');
var join = Promise.join;
function swaggerGenerator(options) {
    registerHelpers();
    if (!options.clientName) {
        options.clientName = 'ApiClient';
    }
    if (!options.renameDefinitions) {
        options.renameDefinitions = {};
    }
    return through.obj(function (file, enc, cb) {
        var through2Context = this;
        if (file.isStream()) {
            throw diagnostics.newPluginError('Streaming not supported');
        }
        if (file.isNull()) {
            throw diagnostics.newPluginError('A description file is required');
        }
        if (file.isBuffer()) {
            parse.parse(file.history[0])
                .then(function (result) {
                return { options: options, api: result, through: through2Context };
            })
                .then(loadTemplateFiles)
                .then(loadLanguageOptions)
                .then(wrapHandleBarsContext)
                .then(applyTemplates)
                .then(function () { cb(); });
        }
    });
}
function wrapHandleBarsContext(context) {
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
function applyTemplates(context) {
    if (context.options.singleFile) {
        var singleFileTemplate = context.templates['SingleFile'];
        gutil.log(JSON.stringify(Object.keys(context.templates)));
        var serviceClientFile = new gutil.File({
            cwd: "",
            base: "",
            path: context.options.clientName + context.languageOptions.fileExtension,
            contents: new Buffer(singleFileTemplate(context.handlebarsContext), 'utf8')
        });
        context.through.push(serviceClientFile);
    }
    return Promise.resolve(context);
}
function loadTemplateFiles(context) {
    var templateDir = context.options.templatePath ?
        context.options.templatePath : path.join(__dirname, './templates/', context.options.template.replace(/-/g, '/'));
    gutil.log(templateDir);
    var templates = {};
    var deferral = Promise.defer();
    fs.readdir(templateDir, function (err, files) {
        gutil.log(JSON.stringify(files));
        async.eachSeries(files, function (templateFilePath, cb) {
            gutil.log(templateFilePath);
            fs.readFile(path.join(templateDir, templateFilePath), 'utf8', function (err, content) {
                if (!err) {
                    var fileName = path.basename(templateFilePath, path.extname(templateFilePath));
                    handlebars.registerPartial(fileName, content);
                    templates[fileName] = handlebars.compile(content, { noEscape: true });
                }
                else {
                    diagnostics.error(err);
                }
                cb(err);
            });
        }, function (err) {
            if (err) {
                diagnostics.error(err);
                deferral.reject(err);
            }
            else {
                context.templates = templates;
                deferral.resolve(context);
            }
        });
    });
    return deferral.promise;
}
function loadLanguageOptions(context) {
    var deferral = Promise.defer();
    var languageDir = context.options.templatePath ?
        context.options.templatePath : path.join(__dirname, './templates/', context.options.template.split(/-/g)[0]);
    fs.readFile(path.join(languageDir, 'languageOptions.json'), 'utf8', function (err, content) {
        if (!err) {
            context.languageOptions = JSON.parse(content);
            deferral.resolve(context);
        }
        else {
            deferral.reject(err);
        }
    });
    return deferral.promise;
}
function registerHelpers() {
    handlebars.registerHelper('json', function (context) {
        return JSON.stringify(context, null, 4);
    });
    handlebars.registerHelper('lowerCase', function (context) {
        return context.toLowerCase();
    });
    handlebars.registerHelper('upperCase', function (context) {
        return context.toUpperCase();
    });
    handlebars.registerHelper('camlCase', function (context) {
        var contextType = typeof context;
        if (contextType === 'string') {
            context = context.split(/[^\w]/g);
        }
        return camlCasePreserve(context);
    });
    gutil.log(gutil.colors.cyan('camlCase registered'));
    handlebars.registerHelper('pascalCase', function (context) {
        var contextType = typeof context;
        if (contextType === 'string') {
            context = context.split(/[^\w]/g);
        }
        return pascalCasePreserve(context);
    });
    handlebars.registerHelper('pascalCaseOverwriteCasing', function (context) {
        var contextType = typeof context;
        if (contextType === 'string') {
            context = context.split(/[^\w]/g);
        }
        return pascalCase(context);
    });
    gutil.log(gutil.colors.cyan('pascalCase registered'));
    handlebars.registerHelper('getType', function (context, options) {
        var mapper = contextBuilder.getTypeMapper();
        if (mapper) {
            return options.fn(mapper.getType(context));
        }
        else {
            return options.fn({});
        }
    });
    handlebars.registerHelper('mapLookup', function (map, lookupValue, options) {
        if (map) {
            return options.fn(map[lookupValue]);
        }
        return options.fn({});
    });
    gutil.log(gutil.colors.cyan('getType registered'));
}
function camlCasePreserve(words) {
    return words.map(function (x, index) {
        if (index) {
            return firstLetterUpperCasePreserveCasing(x);
        }
        else {
            return firstLetterLowerCasePreserveCasing(x);
        }
    }).join('');
}
function pascalCasePreserve(words) {
    return words.map(function (x, index) {
        return firstLetterUpperCasePreserveCasing(x);
    }).join('');
}
function pascalCase(words) {
    return words.map(function (x, index) {
        return firstLetterUpperCase(x);
    }).join('');
}
function firstLetterUpperCase(str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}
function firstLetterUpperCasePreserveCasing(str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1);
}
function firstLetterLowerCasePreserveCasing(str) {
    return str.substring(0, 1).toLowerCase() + str.substring(1);
}
module.exports = swaggerGenerator;
