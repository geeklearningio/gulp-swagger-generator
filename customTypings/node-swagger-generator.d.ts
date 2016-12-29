declare module "node-swagger-generator" {

    export interface ISink {
        push(name: string, content: string): void;
        complete(): void;
    }

    export interface IOperationFilter {

    }

    export interface IDefinitionFilter {

    }

    export interface IProvideGenerationFilters {
        operationFilters?: IOperationFilter[];
        definitionFilters?: IDefinitionFilter[];
    }

    export interface IImportedType {
        typeName: string;
        namespace: string;
    }

    export interface IDependency {
        name?: string;
        version?: string;
        types: IImportedType[];
    }

    export interface IProvideDependencies {
        dependencies?: { [key: string]: IDependency };
        ambientTypes?: IImportedType[];
        ambientNamespaces?: string[];
    }


    export interface ISwaggerGeneratorOptions extends IProvideGenerationFilters, IProvideDependencies {
        language: string;
        framework: string;
        version: string;

        mode: string;

        contentTypes?: {
            preferred?: string[];
            override?: string[];
        }

        clientName?: string;

        templateOptions: any;
        handlerbarsExtensions?: any
        renameDefinitions?: { [from: string]: string }
    }

    export function generateFromJsonOrYaml(swaggerJsonOrYaml: string, options: ISwaggerGeneratorOptions, sink: ISink, templateStores?: string[]): any;

}