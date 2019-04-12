(function() {
  (function() {
    var Container;
    Container = function() {
      return Container = class Container {
        constructor(attributes, options = {}) {
          this.attrs = attributes || {};
          this.permissions = options.permissions || {};
          this.model_name = options.model_name;
        }

      };
    };
    Container.$inject = [];
    return angular.module('angularModelLayer.factories').factory('Container', Container);
  })();

}).call(this);
