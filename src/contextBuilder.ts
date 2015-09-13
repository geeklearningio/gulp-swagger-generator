/// <reference path="../typings.d.ts" />

import parse = require('./parse');
import parser = require('swagger-parser');
import gutil = require('gulp-util');
import _ = require('lodash');


var typeMapperInstance: ITypeMapper;

export interface ITypeMapper {
    getType(item: parser.IHasTypeInformation): IType;
}

export interface  IType {
    name: string;
    definition: Definition;
    isAnonymous: boolean;
    isBuiltin: boolean;
    isDefinition: boolean;
    isArray:boolean;
}

export function getTypeMapper() {
    return typeMapperInstance;
}

export function setTypeMapper(typeMapper: ITypeMapper) {
    typeMapperInstance = typeMapper;
}

var verbs: string[] = ["get", "head", "options", "delete", "post", "patch", "put"];

export interface IGenerationContext {
    definitions?: Definition[];
    definitionsMap?: {[ref: string]: Definition};
    operations?: Operation[];
}

export function buildHandlebarsContext(api: parse.IParsedSwagger, renameDefinitions: {[from:string] : string}): any {

    var context: IGenerationContext = {};

    context.definitions = [];

    context.definitionsMap = {};

    context.operations = [];

    _.forEach(api.api.definitions, (definition: parser.ISchema, definitionName: string) => {

        var ref = '#\/definitions\/' + definitionName.replace(/\//g, '~1');

        var renameTo = renameDefinitions[definitionName];

        if (renameTo) {
            definitionName = renameTo;
        }


        let definitionContext = new Definition(definitionName, definition);
        context.definitions.push(definitionContext);
        context.definitionsMap[ref] = definitionContext
    });

    _.forEach(context.definitions, (definition: Definition) => {
        if (definition.ancestorRef) {
            definition.ancestor = context.definitionsMap[definition.ancestorRef];
        }
    });


    _.forEach(api.api.paths, (path: parser.IPath, pathName: string) => {
        for (var i = 0; i < verbs.length; i++) {
            var verb = verbs[i];
            let operation: parser.IOperation = (<any>path)[verb];
            if (operation) {
                context.operations.push(new Operation(pathName, verb.toUpperCase(), path, operation, context));
            }
        }
    });

    return context;
}

export class Operation {
    public rawPath: string;
    public pathSegments: {name: string, isParam: boolean}[];
    public verb: string;
    public requestBody: any;
    public successResponse: any;
    public errorResponse: any;
    public headers: Argument[];
    public query: Argument[];
    public formData: Argument[];
    public pathParams: Argument[];
    public args: Argument[];
    public requestContentType: string;
    public responseContentType: string;

    public isJsonRequest: boolean;
    public isJsonResponse: boolean;
    public isFormDataRequest: boolean;

    public description: string;
    public consumes: string[];
    public produces: string[];

    public security: string;

    constructor(pathName: string, verb: string, path: parser.IPath, method: parser.IOperation, context: any) {
        this.rawPath = pathName;
        this.verb = verb;
        this.pathSegments = [];
        this.description = method.description;

        _.forEach(pathName.split('/'), (segment)=> {
            if (segment.length) {
                if (segment[0] == '{') {
                    this.pathSegments.push({name: segment.substring(1, segment.length - 1), isParam: true});
                } else {
                    this.pathSegments.push({name: segment, isParam: false})
                }
            }
        });

        this.args = [];

        _.forEach(method.parameters, (parameter: parser.IParameterOrReference, index: number) => {
            var argument = new Argument(parameter);
            this.args.push(argument);
        });

        var bodyArg = _.filter(this.args, (arg)=> arg.in === "body");
        if (bodyArg.length) {
            this.requestBody = bodyArg[0];
        }

        this.headers = _.filter(this.args, (arg)=> arg.in === "header");
        this.query = _.filter(this.args, (arg)=> arg.in === "query");
        this.formData = _.filter(this.args, (arg)=> arg.in === "formData");
        this.pathParams = _.filter(this.args, (arg)=> arg.in === "path");

        this.args = this.args.sort(optionalThenAlpha);


        this.consumes = method.consumes;
        this.produces = method.produces;

        if (!this.consumes || !this.consumes.length) {
            this.consumes = ["application/json"];
        }

        if (!this.produces || !this.produces.length) {
            this.produces = ["application/json"];
        }

        this.isJsonRequest = this.consumes[0] === "application/json";
        this.isJsonResponse = this.produces[0] === "application/json";
        this.isFormDataRequest = this.consumes[0] === "multipart/form-data";

        this.security = method.security ? _.keys(method.security[0])[0] : null;

        _.forEach(method.responses, (response: parser.IResponse, status: string) =>{
            if (status.indexOf('20') === 0){
                this.successResponse = response.schema
            }
        });

    }
}

var optionalThenAlpha = (a: any, b: any): number => {
    if (a.optional === b.optional) {
        return a.name > b.name ? 1 : -1;
    } else {
        return a.optional ? 1 : -1;
    }
};

export class Argument implements parser.IHasTypeInformation {
    name: string;
    in: string;
    type: string;
    format: string;
    $ref: string;
    items: parser.IHasTypeInformation;
    description: string;
    optional: boolean;

    constructor(parameter: parser.IParameterOrReference) {
        this.name = parameter.name;
        this.in = parameter.in;
        this.type = parameter.type;
        this.format = parameter.format;
        this.items = parameter.items;
        this.$ref = parameter.$ref;
        this.description = parameter.description;
        this.optional = !parameter.required;
    }
}

export class Definition {
    public rawName: string;
    public nameParts: string[];

    public properties: Property[];
    public ancestorRef: string;
    public ancestor: Definition;

    constructor(name: string, schema: parser.ISchema) {
        if (name && schema) {
            this.rawName = name;
            this.nameParts = name.split(/[^\w]/g);
            this.properties = [];

            var injectProperties = (schemaProperties: any)=> {
                if (schemaProperties) {
                    _.forEach(schemaProperties, (property: parser.IProperty, propertyName: string) => {
                        let propertyContext = new Property(propertyName, property);
                        this.properties.push(propertyContext);
                    });
                }
            };

            injectProperties(schema.properties);

            if (schema.allOf) {
                _.forEach(schema.allOf, (item) => {
                    if (item.$ref) {
                        this.ancestorRef = item.$ref;
                    } else {

                    }
                    injectProperties(item.properties);
                });
            }
        }
    }
}

export class Property implements parser.IHasTypeInformation {
    public name: string;
    public type: string;
    public format: string;
    public $ref: string;
    public description: string;
    public items: parser.IHasTypeInformation;
    public definition: Definition;

    constructor(name: string, schema: parser.IProperty) {
        this.name = name;
        this.$ref = schema.$ref;
        this.format = schema.format;
        this.type = schema.type;
        this.description = schema.description;
        this.items = schema.items;

        if (schema.properties) {
            this.definition = new Definition(name, schema);
        }
    }
}
