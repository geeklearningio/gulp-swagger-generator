/// <reference path="../typings.d.ts" />
/// <reference path="index.d.ts" />
import contextBuilder = require('./contextBuilder');
import swaggerGenerator = require('./swaggerGenerator');
export declare function createTypeMapper(context: swaggerGenerator.Context): contextBuilder.ITypeMapper;
