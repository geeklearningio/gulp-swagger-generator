/// <reference path="../typings.d.ts" />
/// <reference path="index.ts" />

import contextBuilder = require('./contextBuilder');
import swaggerGenerator = require('./swaggerGenerator');
import parser = require('swagger-parser');
import gutil = require('gulp-util');
import _ = require('lodash');

export function createTypeMapper(context: swaggerGenerator.Context): contextBuilder.ITypeMapper {
    gutil.log(JSON.stringify(Object.keys(context.handlebarsContext.api)));
    return new TypescriptTypeMapper(context.handlebarsContext.api.definitionsMap);
}


class TypescriptTypeMapper implements contextBuilder.ITypeMapper {

    definitions: {[ref: string] : contextBuilder.Definition};

    constructor(definitions: {[ref: string] : contextBuilder.Definition}) {
        this.definitions = definitions;
    }

    getType(property: parser.IHasTypeInformation): TypescriptType {
        if (!property){
            return TypescriptType.any;
        }
        if ((<any>property).isLanguageType) {
            return <any>property;
        }
        if (property.$ref) {
            //return TypescriptType.any;
            return TypescriptType.fromDefinition(this.definitions[property.$ref]);
        } else {
            let type = property.type;
            if (type === 'integer' || type === 'number') {
                return TypescriptType.number;
            } else if (type == 'string') {
                if (property.format == 'date-time' || property.format == 'date') {
                    return TypescriptType.date;
                } else {
                    return TypescriptType.string;
                }
            } else if (type == 'boolean') {
                return TypescriptType.boolean;
            } else if (type === 'object') {
                if ((<any>property).definition) {
                    return TypescriptType.anonymous((<any>property).definition);
                }
                return TypescriptType.any;
            } else if (type === 'array') {
                return this.getType(property.items).asArray();
            } else if (type === 'file') {
                return TypescriptType.file;
            } else {
                return TypescriptType.any;
            }
        }
    }
}

class TypescriptType implements contextBuilder.IType {
    isLanguageType: boolean;
    name: string;
    definition: contextBuilder.Definition;
    isAnonymous: boolean;
    isBuiltin: boolean;
    isDefinition: boolean;
    isArray: boolean;
    isFile: boolean;

    constructor(name: string, definition: contextBuilder.Definition, isBuiltin: boolean, isDefinition: boolean, isAnonymous: boolean, isArray: boolean = false, isFile: boolean = false) {
        this.name = name;
        this.definition = definition;
        this.isBuiltin = isBuiltin;
        this.isDefinition = isDefinition;
        this.isAnonymous = isAnonymous;
        this.isArray = false;
        this.isFile = isFile;
        this.isLanguageType = true;
    }

    public static date: TypescriptType = new TypescriptType('Date', null, true, false, false);
    public static string: TypescriptType = new TypescriptType('string', null, true, false, false);
    public static number: TypescriptType = new TypescriptType('number', null, true, false, false);
    public static boolean: TypescriptType = new TypescriptType('boolean', null, true, false, false);
    public static any: TypescriptType = new TypescriptType('any', null, true, false, false);
    public static file: TypescriptType = new TypescriptType('Uint8Array', null, true, false, false, false, true);

    public static fromDefinition(definition: contextBuilder.Definition): TypescriptType {
        return new TypescriptType(null, definition, false, true, false);
    }

    public static anonymous(definition: contextBuilder.Definition): TypescriptType {
        return new TypescriptType(null, definition, false, false, true);
    }

    public asArray(): TypescriptType {
        var result = _.clone(this, false);
        result.isArray = true;
        return result;
    }
}
