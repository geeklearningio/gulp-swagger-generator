/// <reference path="../typings.d.ts" />

import contextBuilder = require('./contextBuilder');
import index = require('index');
import parser = require('swagger-parser');
import gutil = require('gulp-util');
import _ = require('lodash');

export function createTypeMapper(context: index.Context): contextBuilder.ITypeMapper {
    gutil.log(JSON.stringify(Object.keys(context.handlebarsContext.api)));
    return new CSharpTypeMapper(context.handlebarsContext.api.definitionsMap);
}


class CSharpTypeMapper implements contextBuilder.ITypeMapper {

    definitions: {[ref: string] : contextBuilder.Definition};

    constructor(definitions: {[ref: string] : contextBuilder.Definition}) {
        this.definitions = definitions;
    }

    getType(property: parser.IHasTypeInformation): CSharpType {
        if (!property) {
            return CSharpType.any;
        }
        if ((<any>property).isLanguageType) {
            return (<any>property);
        }
        if (property.$ref) {
            //return TypescriptType.any;
            return CSharpType.fromDefinition(this.definitions[property.$ref]);
        } else {
            let type = property.type;
            if (type === 'integer' || type === 'number') {
                return CSharpType.number(property.format);
            } else if (type == 'string') {
                if (property.format === "date" || property.format === "date-time"){
                    return CSharpType.dateTimeOffset;
                }
                return CSharpType.string;
            } else if (type == 'boolean') {
                return CSharpType.boolean;
            } else if (type === 'object') {
                if ((<any>property).definition) {
                    return CSharpType.anonymous((<any>property).definition);
                }
                if (property.additionalProperties) {
                    return CSharpType.dictionary(CSharpType.string, this.getType(property.additionalProperties));
                }
                return CSharpType.any;
            } else if (type === 'array') {
                return this.getType(property.items).asArray();
            } else if (type === 'file') {
                return CSharpType.file;
            } else if (type === 'date') {
                return CSharpType.file;
            } else {
                return CSharpType.any;
            }
        }
    }
}

class CSharpType implements contextBuilder.IType {
    isLanguageType: boolean;
    name: string;
    definition: contextBuilder.Definition;
    isAnonymous: boolean;
    isBuiltin: boolean;
    isDefinition: boolean;
    isArray: boolean;
    isFile: boolean;
    isDictionary: boolean;
    keyType: CSharpType;
    valueType: CSharpType;

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

    public static string: CSharpType = new CSharpType('string', null, true, false, false);
    public static boolean: CSharpType = new CSharpType('bool', null, true, false, false);
    public static any: CSharpType = new CSharpType('object', null, true, false, false);
    public static file: CSharpType = new CSharpType('string', null, true, false, false, false, true);
    public static dateTimeOffset: CSharpType = new CSharpType('DateTimeOffset',  null, true, false, false);

    public static fromDefinition(definition: contextBuilder.Definition): CSharpType {
        return new CSharpType(null, definition, false, true, false);
    }

    public static anonymous(definition: contextBuilder.Definition): CSharpType {
        return new CSharpType(null, definition, false, false, true);
    }

    public static dictionary(keyType: CSharpType, valueType: CSharpType): CSharpType {
        var type = new CSharpType(null, null, false, false, false);
        type.isDictionary = true;
        type.keyType = keyType;
        type.valueType = valueType;
        type.name = 'Dictionary';
        return type;
    }

    public static number(format: string): CSharpType {
        if (format === "int32") {
            return new CSharpType('int', null, true, false, false);
        } else if (format === "int64") {
            return new CSharpType('long', null, true, false, false);
        } else if (format === "float") {
            return new CSharpType('float', null, true, false, false);
        } else if (format === "double") {
            return new CSharpType('double', null, true, false, false);
        }
    }

    public asArray(): CSharpType {
        var result = _.clone(this, false);
        result.isArray = true;
        return result;
    }
}
