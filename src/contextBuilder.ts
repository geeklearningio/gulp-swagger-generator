/// <reference path="../typings.d.ts" />

import parse = require('./parse');
import parser = require('swagger-parser');
import gutil = require('gulp-util');
import _ = require('lodash');


var typeMapper: ITypeMapper;

export interface ITypeMapper {
    getType(item: parser.IHasTypeInformation): IType;
}

export interface  IType {
    name: string;
    definition: Definition;
    isAnonymous: boolean;
    isBuiltin: boolean;
    isDefinition: boolean;
}

export function getTypeMapper() {
    return typeMapper;
}

export function setTypeMapper(typeMapper: ITypeMapper) {
    typeMapper = typeMapper;
}



export function buildHandlebarsContext(api: parse.IParsedSwagger): any {

    var context: any = {};

    console.log(JSON.stringify(api.metadata));

    context.definitions = [];

    context.definitionsMap = {};

    _.forEach(api.api.definitions, (definition: parser.ISchema, definitionName: string) => {
        let definitionContext = new Definition(definitionName, definition);
        context.definitions.push(definitionContext);
        context.definitionsMap['#\/definitions\/' + definitionName.replace(/\//g, '~1')] = definitionContext
    });

    _.forEach(context.definitions, (definition: Definition) => {
        if (definition.ancestorRef) {
            definition.ancestor = context.definitionsMap[definition.ancestorRef];
            console.log(definition.ancestor.rawName);
        }
    });
    return context;
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
    public definition: string;

    constructor(name: string, schema: parser.IProperty) {
        this.name = name;
        this.$ref = schema.$ref;
        this.format = schema.format;
        this.type = schema.type;
        this.definition = null;
    }
}
