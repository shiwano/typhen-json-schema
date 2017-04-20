'use strict';

var fs = require('fs');
var _ = require('lodash');
var inflection = require('inflection');
var jsesc = require('jsesc');

var keywords = {
  string: {
    minLength: 'number',
    maxLength: 'number',
    pattern: 'string',
    format: 'string',
    default: 'string'
  },
  number: {
    multipleOf: 'number',
    minimum: 'number',
    maximum: 'number',
    exclusiveMinimum: 'boolean',
    exclusiveMaximum: 'boolean',
    default: 'number'
  },
  object: {
    minProperties: 'number',
    maxProperties: 'number'
  },
  array: {
    minItems: 'number',
    maxItems: 'number',
    uniqueItems: 'boolean'
  }
};
var aliasMap = {};

module.exports = function(typhen, options) {
  options = _.defaults(options, {
    baseUri: '',
    enumType: 'integer'
  });

  function getEnumValues(enumSymbol) {
    return enumSymbol.members.map(getEnumValue).join(', ');
  }

  function getEnumValue(enumMemberSymbol) {
    return options.enumType === 'string' ? '"' + enumMemberSymbol.name + '"' : enumMemberSymbol.value;
  }

  function formatResult(file) {
    file.contents = new Buffer(JSON.stringify(JSON.parse(file.contents.toString()), null, 2));
  }

  return typhen.createPlugin({
    pluginDirectory: __dirname,
    namespaceSeparator: '/',
    customPrimitiveTypes: ['integer'],
    handlebarsOptions: {
      data: options,
      partials: {
        object: fs.readFileSync(__dirname + '/templates/object.hbs', 'utf-8'),
        type: fs.readFileSync(__dirname + '/templates/type.hbs', 'utf-8')
      },
      helpers: {
        escape: function(str) {
          return jsesc(str, { quotes: 'double' });
        },
        required: function(properties) {
          return properties.filter(function(p) {
            return !p.isOptional;
          }).map(function(p) {
            return '"' +  p.name + '"';
          }).join(', ');
        },
        keyword: function(type, tag) {
          var keywordsByType;
          if (type.name === 'number' || type.name === 'integer') {
            keywordsByType = keywords.number;
          } else if (type.name === 'string') {
            keywordsByType = keywords.string;
          } else if (type.isArray || type.isTuple) {
            keywordsByType = keywords.array;
          } else {
            keywordsByType = keywords.object;
          }
          if (_.isString(keywordsByType[tag.name])) {
            if (keywordsByType[tag.name] === 'string') {
              return '"' + tag.name + '": "' + tag.value + '",';
            } else {
              return '"' + tag.name + '": ' + tag[keywordsByType[tag.name]] + ',';
            }
          } else {
            typhen.logger.debug('Unsupported tag: ' + tag.name);
            return;
          }
        },
        typeProperty: function(type, tagTable) {
          if (type.isPrimitiveType) {
            if (type.name === 'any') {
              return;
            } else if (type.name === 'number' && tagTable && tagTable.integer) {
              return '"type": "integer"';
            } else {
              return '"type": "' + type.name + '"';
            }
          } else if (type.isEnum) {
            return '"enum": [' + getEnumValues(type) + ']';
          } else if (type.isLiteralType) {
            if (type.isEnumLiteralType) {
              return '"enum": [' + getEnumValue(type.enumMember) + ']';
            } else {
              return '"enum": [' + type.name + ']';
            }
          } else {
            var pathSegments = _.flatten([type.ancestorModules.map(function(m) { return m.name; }), type.name], true);
            var typePath = pathSegments.map(function(s) { return inflection.underscore(s); }).join('/');
            return '"$ref": "' + options.baseUri + '/' + typePath + '.json"';
          }
        }
      }
    },

    generate: function(generator, types, modules) {
      modules.forEach(function(type) {
        type.typeAliases.forEach(function(alias) {
          if (_.isEmpty(alias.type.rawName)) {
            aliasMap[alias.type.name] = alias.name;
            if (alias.docComment) {
              alias.type.docComment = alias.docComment;
            }
            formatResult(generator.generate('templates/base.hbs', 'underscore:**/*.json', alias));
          }
        });
      });
      types.forEach(function(type) {
        switch (type.kind) {
          case typhen.SymbolKind.Interface:
          case typhen.SymbolKind.Class:
            formatResult(generator.generate('templates/base.hbs', 'underscore:**/*.json', type));
            break;
        }
      });
    },

    rename: function(type, name) {
      return aliasMap[name] || name;
    }
  });
};
