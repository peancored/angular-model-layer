(function() {
  (function() {
    var Collection;
    Collection = function($registry, $q, $filter, $injector, $timeout) {
      return Collection = (function() {
        class Collection {
          constructor(models, options) {
            var ref, ref1;
            this.$nextPage = this.$nextPage.bind(this);
            this.$busy = false;
            this.collection = models;
            this.filter = options.filter || {};
            this.options = options.options || {};
            this.$$subscriptions = {};
            if ((ref = options.params) != null ? ref.infinite_scroll : void 0) {
              this.infinite_scroll = true;
              this.limit = ((ref1 = options.params) != null ? ref1.limit : void 0) || 10;
            }
            this.$items_count = 0;
          }

          $fetch(options = {}) {
            var params;
            params = options.additional || {};
            if (this.infinite_scroll) {
              angular.merge(params, {
                limit: this.limit
              });
            }
            this.promise = $registry.fetchCollection(this, params);
            if (!options.silent) {
              this.$busy = true;
            }
            if (options.hard_reset) {
              this.collection = [];
            }
            this.promise.then((data) => {
              var _delete;
              this.$busy = false;
              if (options.reset) {
                _delete = this.collection.filter(function(model) {
                  return $filter('filter')(data.items, {
                    attrs: {
                      id: model.attrs.id
                    }
                  }, true).length === 0;
                });
                _delete.each((item) => {
                  return this.collection.splice(this.collection.indexOf(item), 1);
                });
              }
              return this.$parseResponse(data);
            }, null, (data) => {
              this.$busy = false;
              return this.$parseResponse(data);
            });
            return this.promise;
          }

          $parseResponse(data) {
            this.$items_count = data.items_count;
            return data.items.each((container) => {
              var model;
              model = this.$add($registry.wrapModel(this.name, container.attrs, {
                permissions: container.permissions
              }));
              return model != null ? model.$sort_position = container.sort_position : void 0;
            });
          }

          $add(model, options = {}) {
            var old;
            if (model.name !== this.name.singularize()) {
              return void 0;
            }
            if (model.attrs.id) {
              old = this.$findBy({
                id: model.attrs.id
              });
            } else {
              old = null;
            }
            if (!old && model.$match(this.filter)) {
              this.collection.push(model);
              this.$$trigger('new:model', model);
              if (options.event) {
                this.$updateItemsCount();
              }
              return model;
            } else if (old) {
              if (!angular.equals({}, old.$mergeAttrs(model.attrs))) {
                this.$$trigger('change:model', old);
              }
              return old;
            }
            return void 0;
          }

          $findBy(attrs) {
            return this.$filter(attrs).first();
          }

          $filter(attrs) {
            var results;
            results = $filter('filter')(this.collection, {
              attrs: attrs
            }, true) || [];
            return results;
          }

          $nextPage() {
            var deferred;
            deferred = $q.defer();
            if (this.$items_count > this.collection.length && !this.$busy) {
              this.$fetch({
                additional: {
                  limit: this.limit,
                  offset: this.collection.length
                }
              }).then(function(data) {
                return deferred.resolve(data);
              });
            } else {
              deferred.resolve();
            }
            return deferred.promise;
          }

          $newModel(attrs = {}) {
            return $registry.wrapModel(this.name, angular.extend(this.filter, attrs));
          }

          $remove(model_name, id, options = {}) {
            var model;
            model = this.$findBy({
              id: id
            });
            if (model_name === this.name && model) {
              this.collection.splice(this.collection.indexOf(model), 1);
              this.$$trigger('remove:model', model);
              if (options.event) {
                return this.$updateItemsCount();
              }
            }
          }

          $beforeDestroy(callback) {
            return this.$$before_destroy_callback = callback;
          }

          $$trigger(event_name, model) {
            var ref;
            return (ref = this.$$subscriptions[event_name]) != null ? ref.each(function(callback) {
              return $timeout(function() {
                return callback(model);
              });
            }) : void 0;
          }

          $on(event_name, callback) {
            var base;
            (base = this.$$subscriptions)[event_name] || (base[event_name] = []);
            return this.$$subscriptions[event_name].push(callback);
          }

          $clearMemory() {
            this.$$subscriptions = {};
            if (this.$$before_destroy_callback) {
              this.$$before_destroy_callback();
              delete this.$$before_destroy_callback;
            }
            return this.collection.each(function(model) {
              return model.$clearMemory();
            });
          }

          $updateItemsCount() {
            return this.$fetch({
              additional: {
                limit: 0
              },
              silent: true
            });
          }

        };

        Collection.prototype.url = '';

        Collection.prototype.name = 'data';

        return Collection;

      })();
    };
    Collection.$inject = ['$registry', '$q', '$filter', '$injector', '$timeout'];
    return angular.module('angularModelLayer.factories').factory('Collection', Collection);
  })();

}).call(this);
