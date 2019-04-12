(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('angularModelLayer.config', [])
      .value('angularModelLayer.config', {
          debug: true
      });

  // Modules
  angular.module('angularModelLayer.factories', []);
  angular.module('angularModelLayer.providers', []);
  angular.module('angularModelLayer',
      [
          'angularModelLayer.config',
          'angularModelLayer.factories',
          'angularModelLayer.providers'
      ]);

})(angular);
