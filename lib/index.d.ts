/// <reference path="../typings.d.ts" />
import swaggerGeneratorDef = require('./swaggerGenerator');
declare function swaggerGenerator(options: swaggerGeneratorDef.ISwaggerGeneratorOptions): NodeJS.ReadWriteStream;
export = swaggerGenerator;
