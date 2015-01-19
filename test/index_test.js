'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var rimraf = require('rimraf');
var glob = require('glob');
var validator = require('tv4').freshApi();
var tv4Formats = require('tv4-formats');
validator.addFormat(tv4Formats);

var typhen = require('typhen');

describe('typhen-json-schema', function() {
  var expectedFileNames = glob.sync('./test/fixtures/example/**/!(*_sample).json');

  before(function(done) {
    typhen.logger.level = typhen.logger.LogLevel.Silent;

    rimraf('./.tmp/generated', function() {
      var plugin = typhen.loadPlugin('./index.js', {
        baseUri: 'http://example.com/typhen-json-schema'
      });
      typhen.run({
        plugin: plugin,
        src: 'test/fixtures/definitions.d.ts',
        dest: '.tmp/generated'
      }).done(function() {
        done();
      }, function(e) {
        throw e;
      });
    });

    expectedFileNames.forEach(function(expectedFileName) {
      var schema = require(path.resolve(expectedFileName));
      var schemaPath = expectedFileName.replace('./test/fixtures', 'http://example.com/typhen-json-schema');
      validator.addSchema(schemaPath, schema);
    });
  });

  expectedFileNames.forEach(function(expectedFileName) {
    context(expectedFileName.replace('./test/fixtures/', ''), function() {
      it('should generate a JSON file', function() {
        var actualFileName = expectedFileName.replace('./test/fixtures', './.tmp/generated');
        assert(fs.readFileSync(actualFileName, 'utf-8') === fs.readFileSync(expectedFileName, 'utf-8'));
      });

      it('should generate a valid JSON-Schema', function() {
        var schema = require(path.resolve(expectedFileName));
        var data = require(path.resolve(expectedFileName.replace('.json', '_sample')));
        var valid = validator.validateResult(data, schema);
        assert(valid.valid);
        assert(valid.error === null);
        assert(valid.missing.length === 0);
      });
    });
  });

  it('should not generate unnecessary files', function() {
    var actualFileNames = glob.sync('./.tmp/generated/example/**/*.json');
    assert(actualFileNames.length === expectedFileNames.length);
  });
});
