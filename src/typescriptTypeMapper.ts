/// <reference path="../typings.d.ts" />

import contextBuilder = require('./contextBuilder');
import index = require('index');
import parser = require('swagger-parser');

export function createTypeMapper(context: index.Context): contextBuilder.ITypeMapper {
    return new TypescriptTypeMapper(context.handlebarsContext.definitionsMap);
}


class TypescriptTypeMapper implements contextBuilder.ITypeMapper {

    defintions: {[ref: string] : contextBuilder.Definition};

    constructor(defintions: {[ref: string] : contextBuilder.Definition}) {
        this.defintions = defintions;
    }

    getType(property: parser.IHasTypeInformation): contextBuilder.IType {
        if (property.$ref){
           return TypescriptType.fromDefinition(this.defintions[property.$ref]);
        } else {
            let type = property.type;
            if (type === 'integer' || type === 'number') {
                return TypescriptType.number;
            } else if (type == 'string') {
                return TypescriptType.string;
            } else if (type == 'boolean') {
                return TypescriptType.boolean;
            } else if (type === 'object') {
                return TypescriptType.any;
            } else if (type === 'array') {
                return TypescriptType.any;
            } else if (type === 'file') {
                return TypescriptType.any;
            } else {
                return TypescriptType.any;
            }
        }
    }
}

class TypescriptType implements contextBuilder.IType {
    name: string;
    definition: contextBuilder.Definition;
    isAnonymous: boolean;
    isBuiltin: boolean;
    isDefinition: boolean;

    constructor(name: string, definition: contextBuilder.Definition, isBuiltin: boolean, isDefinition: boolean, isAnonymous: boolean) {
        this.name = name;
        this.definition = definition;
        this.isBuiltin = isBuiltin;
        this.isDefinition = isDefinition;
        this.isAnonymous = isAnonymous;
    }

    public  static string: TypescriptType = new TypescriptType('string', null, true, false, false);
    public  static number: TypescriptType = new TypescriptType('number', null, true, false, false);
    public  static boolean: TypescriptType = new TypescriptType('boolean', null, true, false, false);
    public  static any: TypescriptType = new TypescriptType('any', null, true, false, false);
    public  static fromDefinition(definition: contextBuilder.Definition): TypescriptType {
        return new TypescriptType(null, definition, false, true, false);
    }
}
