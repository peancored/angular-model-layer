'use strict';

describe('', function() {

  var module;
  var dependencies;
  dependencies = [];

  var hasModule = function(module) {
  return dependencies.indexOf(module) >= 0;
  };

  beforeEach(function() {

  // Get module
  module = angular.module('angularModelLayer');
  dependencies = module.requires;
  });

  it('should load config module', function() {
    expect(hasModule('angularModelLayer.config')).to.be.ok;
  });

  

  

  
  it('should load providers module', function() {
    expect(hasModule('angularModelLayer.providers')).to.be.ok;
  });
  

});
