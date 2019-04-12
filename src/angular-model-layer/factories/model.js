(function() {
  (function() {
    var Model;
    Model = function($q, $registry, $store, Collection) {
      return Model = (function() {
        class Model {
          constructor(attributes = {}, options = {}) {
            Object.defineProperty(this, 'relations', {
              enumerable: false,
              value: {}
            });
            this.permissions = options.permissions || {};
            this.$state = {
              busy: false
            };
            this.$busy = false;
            this.$$initial = attributes;
            this.errors = {};
            this.attrs = {};
            this.$$related_collections = [];
            if (this._relations) {
              Object.keys(this._relations).each((key) => {
                var dependencies, get, relation;
                relation = angular.bind(this, this._relations[key].function);
                dependencies = this._relations[key].dependencies || [];
                get = function() {
                  var cached_dependencies, collection;
                  collection = null;
                  cached_dependencies = {};
                  return () => {
                    var break_cache, i, index, len, ready;
                    break_cache = false;
                    ready = true;
                    for (i = 0, len = dependencies.length; i < len; i++) {
                      key = dependencies[i];
                      if (!this.attrs[key]) {
                        ready = false;
                        break;
                      }
                      if (cached_dependencies[key] !== this.attrs[key]) {
                        break_cache = true;
                        cached_dependencies[key] = this.attrs[key];
                      }
                    }
                    if (ready && (!collection || break_cache)) {
                      if (collection) {
                        index = this.$$related_collections.indexOf(collection);
                        if (index !== -1) {
                          this.$$related_collections.splice(index, 1);
                        }
                        collection.$clearMemory();
                      }
                      collection = relation();
                      this.$$related_collections.push(collection);
                    }
                    return collection;
                  };
                };
                get = angular.bind(this, get)();
                return Object.defineProperty(this.relations, key, {
                  get: get,
                  enumerable: true,
                  configurable: true
                });
              });
            }
            angular.merge(this.attrs, attributes);
          }

          $merge(attrs) {
            //if !angular.equals(@diff(@attrs, attrs), {}) || !angular.equals(@diff(@$$initial, attrs), {})
            this.$$initial = attrs;
            return angular.merge(this.attrs, attrs);
          }

          $mergeAttrs(attrs) {
            var diff;
            diff = this.diff(this.attrs, attrs);
            angular.merge(this.attrs, attrs);
            return diff;
          }

          $fetch(options = {}) {
            this.promise = $registry.fetchModel(this, options);
            this.$busy = true;
            this.$state.busy = true;
            this.promise.then(angular.bind(this, function(container) {
              this.$busy = false;
              this.$state.busy = false;
              return this.$parseResponse(container);
            }), angular.bind(this, function(response) {
              this.$busy = false;
              this.$state.busy = false;
              return this.$fillErrors(response);
            }), angular.bind(this, function(container) {
              this.$busy = false;
              this.$state.busy = false;
              return this.$parseResponse(container);
            }));
            return this.promise;
          }

          $reset() {
            return angular.merge(this.attrs, this.$$initial);
          }

          $save(options = {}) {
            var deferred, promise;
            deferred = $q.defer();
            if ((this.attrs.id && !angular.equals({}, this.diff())) || !this.attrs.id || options.create) {
              promise = $registry.saveModel(this, options);
              this.$busy = true;
              this.$state.busy = true;
              promise.then((container) => {
                this.$busy = false;
                this.$state.busy = false;
                this.$parseResponse(container);
                return deferred.resolve(container.attrs);
              }).catch((response) => {
                this.$busy = false;
                this.$state.busy = false;
                this.$fillErrors(response);
                return deferred.reject(response);
              });
            } else {
              this.$busy = false;
              this.$state.busy = false;
              deferred.resolve(this.attrs);
            }
            return deferred.promise;
          }

          $parseResponse(container) {
            this.permissions = container.permissions || {};
            return this.$merge(container.attrs);
          }

          $fillErrors(response) {
            return Object.keys(response.data.errors).each((attribute) => {
              var base;
              (base = this.errors)[attribute] || (base[attribute] = {});
              this.errors[attribute].status = response.status;
              return this.errors[attribute].data = response.data.errors[attribute];
            });
          }

          $match(filter) {
            var res;
            res = true;
            Object.keys(filter).each((key) => {
              if (!(this.attrs.hasOwnProperty(key) && _this.attrs[key] == filter[key])) {
                return res = false;
              }
            });
            return res;
          }

          $destroy() {
            if (!this.destroy_promise) {
              this.destroy_promise = $registry.destroyModel(this);
              this.destroy_promise.then(() => {
                return this.$clearMemory();
              }).catch(() => {
                return this.destroy_promise = null;
              });
            }
            return this.destroy_promise;
          }

          $clearMemory() {
            return this.$$related_collections.each(function(collection) {
              return collection.$clearMemory();
            });
          }

          diff(original = this.$$initial, edited = this.attrs) {
            var diff, key;
            diff = {};
            for (key in edited) {
              if (this.restricted_keys.indexOf(key) !== -1) {
                continue;
              }
              if (!angular.isObject(original[key]) && original[key] !== edited[key]) {
                diff[key] = edited[key];
              } else if (angular.isObject(original[key]) && this.object_keys.indexOf(key) !== -1) {
                if (!angular.equals({}, this.diff(original[key], edited[key]))) {
                  diff[key] = edited[key];
                }
              }
            }
            return diff;
          }

        };

        Model.prototype.url = '';

        Model.prototype.name = 'data';

        Model.prototype.restricted_keys = [];

        Model.prototype.object_keys = [];

        return Model;

      })();
    };
    Model.$inject = ['$q', '$registry', '$store', 'Collection'];
    return angular.module('anguarModelLayer.factories').factory('Model', Model);
  })();

}).call(this);
