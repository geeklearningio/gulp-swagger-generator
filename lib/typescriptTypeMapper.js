var gutil = require('gulp-util');
var _ = require('lodash');
function createTypeMapper(context) {
    gutil.log(JSON.stringify(Object.keys(context.handlebarsContext.api)));
    return new TypescriptTypeMapper(context.handlebarsContext.api.definitionsMap);
}
exports.createTypeMapper = createTypeMapper;
var TypescriptTypeMapper = (function () {
    function TypescriptTypeMapper(definitions) {
        this.definitions = definitions;
    }
    TypescriptTypeMapper.prototype.getType = function (property) {
        if (!property) {
            return TypescriptType.any;
        }
        if (property.isLanguageType) {
            return property;
        }
        if (property.$ref) {
            return TypescriptType.fromDefinition(this.definitions[property.$ref]);
        }
        else {
            var type = property.type;
            if (type === 'integer' || type === 'number') {
                return TypescriptType.number;
            }
            else if (type == 'string') {
                if (property.format == 'date-time' || property.format == 'date') {
                    return TypescriptType.date;
                }
                else {
                    return TypescriptType.string;
                }
            }
            else if (type == 'boolean') {
                return TypescriptType.boolean;
            }
            else if (type === 'object') {
                if (property.definition) {
                    return TypescriptType.anonymous(property.definition);
                }
                return TypescriptType.any;
            }
            else if (type === 'array') {
                return this.getType(property.items).asArray();
            }
            else if (type === 'file') {
                return TypescriptType.file;
            }
            else {
                return TypescriptType.any;
            }
        }
    };
    return TypescriptTypeMapper;
})();
var TypescriptType = (function () {
    function TypescriptType(name, definition, isBuiltin, isDefinition, isAnonymous, isArray, isFile) {
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
    TypescriptType.fromDefinition = function (definition) {
        return new TypescriptType(null, definition, false, true, false);
    };
    TypescriptType.anonymous = function (definition) {
        return new TypescriptType(null, definition, false, false, true);
    };
    TypescriptType.prototype.asArray = function () {
        var result = _.clone(this, false);
        result.isArray = true;
        return result;
    };
    TypescriptType.date = new TypescriptType('Date', null, true, false, false);
    TypescriptType.string = new TypescriptType('string', null, true, false, false);
    TypescriptType.number = new TypescriptType('number', null, true, false, false);
    TypescriptType.boolean = new TypescriptType('boolean', null, true, false, false);
    TypescriptType.any = new TypescriptType('any', null, true, false, false);
    TypescriptType.file = new TypescriptType('Uint8Array', null, true, false, false, false, true);
    return TypescriptType;
})();
