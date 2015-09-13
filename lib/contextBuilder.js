/// <reference path="../typings.d.ts" />
var _ = require('lodash');
var typeMapperInstance;
function getTypeMapper() {
    return typeMapperInstance;
}
exports.getTypeMapper = getTypeMapper;
function setTypeMapper(typeMapper) {
    typeMapperInstance = typeMapper;
}
exports.setTypeMapper = setTypeMapper;
var verbs = ["get", "head", "options", "delete", "post", "patch", "put"];
function buildHandlebarsContext(api, renameDefinitions) {
    var context = {};
    context.definitions = [];
    context.definitionsMap = {};
    context.operations = [];
    context.host = api.api.host;
    context.basePath = api.api.basePath;
    _.forEach(api.api.definitions, function (definition, definitionName) {
        var ref = '#\/definitions\/' + definitionName.replace(/\//g, '~1');
        var renameTo = renameDefinitions[definitionName];
        if (renameTo) {
            definitionName = renameTo;
        }
        var definitionContext = new Definition(definitionName, definition);
        context.definitions.push(definitionContext);
        context.definitionsMap[ref] = definitionContext;
    });
    _.forEach(context.definitions, function (definition) {
        if (definition.ancestorRef) {
            definition.ancestor = context.definitionsMap[definition.ancestorRef];
        }
    });
    _.forEach(api.api.paths, function (path, pathName) {
        for (var i = 0; i < verbs.length; i++) {
            var verb = verbs[i];
            var operation = path[verb];
            if (operation) {
                context.operations.push(new Operation(pathName, verb.toUpperCase(), path, operation, context));
            }
        }
    });
    return context;
}
exports.buildHandlebarsContext = buildHandlebarsContext;
var Operation = (function () {
    function Operation(pathName, verb, path, method, context) {
        var _this = this;
        this.rawPath = pathName;
        this.verb = verb;
        this.pathSegments = [];
        this.description = method.description;
        _.forEach(pathName.split('/'), function (segment) {
            if (segment.length) {
                if (segment[0] == '{') {
                    _this.pathSegments.push({ name: segment.substring(1, segment.length - 1), isParam: true });
                }
                else {
                    _this.pathSegments.push({ name: segment, isParam: false });
                }
            }
        });
        this.args = [];
        _.forEach(method.parameters, function (parameter, index) {
            var argument = new Argument(parameter);
            _this.args.push(argument);
        });
        var bodyArg = _.filter(this.args, function (arg) { return arg.in === "body"; });
        if (bodyArg.length) {
            this.requestBody = bodyArg[0];
        }
        this.headers = _.filter(this.args, function (arg) { return arg.in === "header"; });
        this.query = _.filter(this.args, function (arg) { return arg.in === "query"; });
        this.formData = _.filter(this.args, function (arg) { return arg.in === "formData"; });
        this.pathParams = _.filter(this.args, function (arg) { return arg.in === "path"; });
        this.args = this.args.sort(optionalThenAlpha);
        this.consumes = method.consumes;
        this.produces = method.produces;
        if (!this.consumes || !this.consumes.length) {
            this.consumes = ["application/json"];
        }
        if (!this.produces || !this.produces.length) {
            this.produces = ["application/json"];
        }
        this.isJsonRequest = this.consumes[0] === "application/json";
        this.isJsonResponse = this.produces[0] === "application/json";
        this.isFormDataRequest = this.consumes[0] === "multipart/form-data";
        this.security = method.security ? _.keys(method.security[0])[0] : null;
        _.forEach(method.responses, function (response, status) {
            if (status.indexOf('20') === 0) {
                _this.successResponse = response.schema;
            }
        });
    }
    return Operation;
})();
exports.Operation = Operation;
var optionalThenAlpha = function (a, b) {
    if (a.optional === b.optional) {
        return a.name > b.name ? 1 : -1;
    }
    else {
        return a.optional ? 1 : -1;
    }
};
var Argument = (function () {
    function Argument(parameter) {
        this.name = parameter.name;
        this.in = parameter.in;
        this.type = parameter.type;
        this.format = parameter.format;
        this.items = parameter.items;
        this.$ref = parameter.$ref;
        this.description = parameter.description;
        this.optional = !parameter.required;
    }
    return Argument;
})();
exports.Argument = Argument;
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
        this.description = schema.description;
        this.items = schema.items;
        if (schema.properties) {
            this.definition = new Definition(name, schema);
        }
    }
    return Property;
})();
exports.Property = Property;
