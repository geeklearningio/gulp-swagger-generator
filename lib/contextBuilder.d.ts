/// <reference path="../typings.d.ts" />
import parse = require('./parse');
import parser = require('swagger-parser');
export interface ITypeMapper {
    getType(item: parser.IHasTypeInformation): IType;
}
export interface IType {
    name: string;
    definition: Definition;
    isAnonymous: boolean;
    isBuiltin: boolean;
    isDefinition: boolean;
}
export declare function getTypeMapper(): ITypeMapper;
export declare function setTypeMapper(typeMapper: ITypeMapper): void;
export declare function buildHandlebarsContext(api: parse.IParsedSwagger): any;
export declare class Definition {
    rawName: string;
    nameParts: string[];
    properties: Property[];
    ancestorRef: string;
    ancestor: Definition;
    constructor(name: string, schema: parser.ISchema);
}
export declare class Property implements parser.IHasTypeInformation {
    name: string;
    type: string;
    format: string;
    $ref: string;
    definition: string;
    constructor(name: string, schema: parser.IProperty);
}
