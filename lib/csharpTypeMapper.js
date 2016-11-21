"use strict";
var gutil = require('gulp-util');
var _ = require('lodash');
function createTypeMapper(context) {
    gutil.log(JSON.stringify(Object.keys(context.handlebarsContext.api)));
    return new CSharpTypeMapper(context.handlebarsContext.api.definitionsMap);
}
exports.createTypeMapper = createTypeMapper;
var CSharpTypeMapper = (function () {
    function CSharpTypeMapper(definitions) {
        this.definitions = definitions;
    }
    CSharpTypeMapper.prototype.getType = function (property) {
        if (!property) {
            return CSharpType.any;
        }
        if (property.isLanguageType) {
            return property;
        }
        if (property.$ref) {
            return CSharpType.fromDefinition(this.definitions[property.$ref]);
        }
        else {
            var type = property.type;
            if (type === 'integer' || type === 'number') {
                return CSharpType.number(property.format);
            }
            else if (type == 'string') {
                if (property.format === "date" || property.format === "date-time") {
                    return CSharpType.dateTimeOffset;
                }
                return CSharpType.string;
            }
            else if (type == 'boolean') {
                return CSharpType.boolean;
            }
            else if (type === 'object') {
                if (property.definition) {
                    return CSharpType.anonymous(property.definition);
                }
                if (property.additionalProperties) {
                    return CSharpType.dictionary(CSharpType.string, this.getType(property.additionalProperties));
                }
                return CSharpType.any;
            }
            else if (type === 'array') {
                return this.getType(property.items).asArray();
            }
            else if (type === 'file') {
                return CSharpType.file;
            }
            else if (type === 'date') {
                return CSharpType.file;
            }
            else {
                return CSharpType.any;
            }
        }
    };
    return CSharpTypeMapper;
}());
var CSharpType = (function () {
    function CSharpType(name, definition, isBuiltin, isDefinition, isAnonymous, isArray, isFile) {
        if (isArray === void 0) { isArray = false; }
        if (isFile === void 0) { isFile = false; }
        this.name = name;
        this.definition = definition;
        this.isBuiltin = isBuiltin;
        this.isDefinition = isDefinition;
        this.isAnonymous = isAnonymous;
        this.isArray = false;
        this.isFile = isFile;
        this.isLanguageType = true;
    }
    CSharpType.fromDefinition = function (definition) {
        return new CSharpType(null, definition, false, true, false);
    };
    CSharpType.anonymous = function (definition) {
        return new CSharpType(null, definition, false, false, true);
    };
    CSharpType.dictionary = function (keyType, valueType) {
        var type = new CSharpType(null, null, false, false, false);
        type.isDictionary = true;
        type.keyType = keyType;
        type.valueType = valueType;
        type.name = 'Dictionary';
        return type;
    };
    CSharpType.number = function (format) {
        if (format === "int32") {
            return new CSharpType('int', null, true, false, false);
        }
        else if (format === "int64") {
            return new CSharpType('long', null, true, false, false);
        }
        else if (format === "float") {
            return new CSharpType('float', null, true, false, false);
        }
        else if (format === "double") {
            return new CSharpType('double', null, true, false, false);
        }
    };
    CSharpType.prototype.asArray = function () {
        var result = _.clone(this, false);
        result.isArray = true;
        return result;
    };
    CSharpType.string = new CSharpType('string', null, true, false, false);
    CSharpType.boolean = new CSharpType('bool', null, true, false, false);
    CSharpType.any = new CSharpType('object', null, true, false, false);
    CSharpType.file = new CSharpType('string', null, true, false, false, false, true);
    CSharpType.dateTimeOffset = new CSharpType('DateTimeOffset', null, true, false, false);
    return CSharpType;
}());
