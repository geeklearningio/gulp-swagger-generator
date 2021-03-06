/// <reference path="../../typings/node/node.d.ts" />

declare module "swagger-parser" {
    import url = require('url');

    export interface IMetadata {
        baseDir: string;
        files : string[];
        urls: url.Url[];
        $refs: any;
    }

    export interface IApi {
        swagger: string;
        info : IApiInfo;
        host?: string;
        basePath?: string;
        schemes: string[];
        consumes: string[];
        produces: string[];
        paths: { [path: string]: IPath; }
        definitions : { [name: string]: ISchema; }
        parameters : { [name: string]: IParameterOrReference; }
        responses: { [name: string]: IResponse; }
        securityDefintions: { [name: string]: IResponse; }
        security: { [name: string]: string[]; }
        tags: ITag[]
        externalDocs?: IExternalDocumentation;
    }

    export interface ITag {
        description?: string;
        name: string;
        externalDocs?: IExternalDocumentation;
    }

    export interface ISecurityScheme {
        type: string;
        description?: string;
        name: string;
        in: string;
        flow: string;
        authorizationUrl?: string;
        tokenUrl?: string;
        scopes: { [name: string]: string; }
    }

    export interface IApiInfo {
        title: string;
        description?: string;
        termsOfService?: string;
        contact?: IContactInfo;
        license?: ILicense;
        version: string;
    }

    export interface IContactInfo {
        name? : string;
        url?: string;
        email: string;
    }

    export interface ILicense {
        name?: string;
        url?: string;
    }

    export interface IOptions {
        parseYaml? : boolean;
        dereference$Refs?: boolean;
        dereferenceInternal$Refs?: boolean;
        resolve$Refs?: boolean;
        resolveExternal$Refs?: boolean;
        validateSchema?: boolean;
        strictValidation?: boolean;
    }

    export interface IPath {
        $ref?: string;
        get?: IOperation;
        put?: IOperation;
        post?: IOperation;
        delete?: IOperation;
        options?: IOperation;
        head?: IOperation;
        patch?: IOperation;
        parameters: IParameterOrReference[];
    }

    export interface  IOperation {
        tags?: string[];
        summary?: string;
        description?: string;
        externalDocs?: IExternalDocumentation;
        operationId: string;
        consumes: string[];
        produces: string[];
        parameters: IParameterOrReference[];
        responses: { [statusOrDefault: string]: IResponse };
        schemes?: string[];
        deprecated?: boolean
        security:  { [name: string]: string[]; }
    }

    export interface  IParameterOrReference extends IHasTypeInformation {
        $ref: string;
        name?: string;
        in?: string;
        description?: string;
        required?: boolean;
        schema?: ISchema;
    }

    export interface  IExternalDocumentation {
        description?: string;
        url: string;
    }

    export interface IResponse {
        description: string;
        schema: ISchema
        headers:  { [name: string]: IHeader }
        examples: { [name: string]: any }
    }

    export interface  ISchema {
        $ref: string
        discriminator?: string;
        readOnly?: boolean;
        xml?: IXml
        externalDocs?: IExternalDocumentation
        example?: any;
        items?: any;
        allOf?: any[];
        properties?: {[propertyName: string] : IProperty};
        additionalProperties?: any;
        required?: string[]
    }

    export interface  IHeader extends IHasTypeInformation{
        description?: string;
        items?: any;
        collectionFormat?: string;
        default?: any;
    }

    export interface IProperty extends IHasTypeInformation {
        description?: string;
    }

    export interface IHasTypeInformation {
        type: string;
        format:string;
        $ref: string;
        items?: IHasTypeInformation
        properties?: {[propertyName: string] : IProperty};
        additionalProperties?: IHasTypeInformation
    }

    export  interface IXml {

    }

    export function parse(file: string, options: IOptions, callback: (err: Error, api: IApi, metadata: any) => void): void;
    export function parse(file: string, callback: (err: Error, api: IApi, metadata: IMetadata) => void): void;
}

