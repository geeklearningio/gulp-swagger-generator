/// <reference path="../typings.d.ts" />
function createTypeMapper(context) {
    return new TypescriptTypeMapper(context.handlebarsContext.definitionsMap);
}
exports.createTypeMapper = createTypeMapper;
var TypescriptTypeMapper = (function () {
    function TypescriptTypeMapper(defintions) {
        this.defintions = defintions;
    }
    TypescriptTypeMapper.prototype.getType = function (property) {
        if (property.$ref) {
            return TypescriptType.fromDefinition(this.defintions[property.$ref]);
        }
        else {
            var type = property.type;
            if (type === 'integer' || type === 'number') {
                return TypescriptType.number;
            }
            else if (type == 'string') {
                return TypescriptType.string;
            }
            else if (type == 'boolean') {
                return TypescriptType.boolean;
            }
            else if (type === 'object') {
                return TypescriptType.any;
            }
            else if (type === 'array') {
                return TypescriptType.any;
            }
            else if (type === 'file') {
                return TypescriptType.any;
            }
            else {
                return TypescriptType.any;
            }
        }
    };
    return TypescriptTypeMapper;
})();
var TypescriptType = (function () {
    function TypescriptType(name, definition, isBuiltin, isDefinition, isAnonymous) {
        this.name = name;
        this.definition = definition;
        this.isBuiltin = isBuiltin;
        this.isDefinition = isDefinition;
        this.isAnonymous = isAnonymous;
    }
    TypescriptType.fromDefinition = function (definition) {
        return new TypescriptType(null, definition, false, true, false);
    };
    TypescriptType.string = new TypescriptType('string', null, true, false, false);
    TypescriptType.number = new TypescriptType('number', null, true, false, false);
    TypescriptType.boolean = new TypescriptType('boolean', null, true, false, false);
    TypescriptType.any = new TypescriptType('any', null, true, false, false);
    return TypescriptType;
})();
