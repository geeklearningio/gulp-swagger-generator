/// <reference path="../typings.d.ts" />
var _ = require('lodash');
var typeMapper;
function getTypeMapper() {
    return typeMapper;
}
exports.getTypeMapper = getTypeMapper;
function setTypeMapper(typeMapper) {
    typeMapper = typeMapper;
}
exports.setTypeMapper = setTypeMapper;
function buildHandlebarsContext(api) {
    var context = {};
    console.log(JSON.stringify(api.metadata));
    context.definitions = [];
    context.definitionsMap = {};
    _.forEach(api.api.definitions, function (definition, definitionName) {
        var definitionContext = new Definition(definitionName, definition);
        context.definitions.push(definitionContext);
        context.definitionsMap['#\/definitions\/' + definitionName.replace(/\//g, '~1')] = definitionContext;
    });
    _.forEach(context.definitions, function (definition) {
        if (definition.ancestorRef) {
            definition.ancestor = context.definitionsMap[definition.ancestorRef];
            console.log(definition.ancestor.rawName);
        }
    });
    return context;
}
exports.buildHandlebarsContext = buildHandlebarsContext;
var Definition = (function () {
    function Definition(name, schema) {
        var _this = this;
        if (name && schema) {
            this.rawName = name;
            this.nameParts = name.split(/[^\w]/g);
            this.properties = [];
            var injectProperties = function (schemaProperties) {
                if (schemaProperties) {
                    _.forEach(schemaProperties, function (property, propertyName) {
                        var propertyContext = new Property(propertyName, property);
                        _this.properties.push(propertyContext);
                    });
                }
            };
            injectProperties(schema.properties);
            if (schema.allOf) {
                _.forEach(schema.allOf, function (item) {
                    if (item.$ref) {
                        _this.ancestorRef = item.$ref;
                    }
                    else {
                    }
                    injectProperties(item.properties);
                });
            }
        }
    }
    return Definition;
})();
exports.Definition = Definition;
var Property = (function () {
    function Property(name, schema) {
        this.name = name;
        this.$ref = schema.$ref;
        this.format = schema.format;
        this.type = schema.type;
        this.definition = null;
    }
    return Property;
})();
exports.Property = Property;
