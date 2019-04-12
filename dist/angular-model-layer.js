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

(function() {
  (function() {
    var AdapterProvider;
    AdapterProvider = function() {
      return {
        $get: function() {
          var provider;
          provider = {
            convert: function(url, method, params, data, headers) {
              var regex, request;
              request = {};
              if (url) {
                request.url = url;
              }
              if (method) {
                request.method = method;
              }
              if (params) {
                request.params = params;
                Object.keys(params).each(function(param) {
                  var regex;
                  regex = new RegExp(`:${param}`);
                  if (request.url.match(regex)) {
                    request.url = request.url.replace(regex, params[param]);
                    return delete request.params[param];
                  }
                });
              }
              regex = /\/:\w+/;
              if (request.url.match(regex)) {
                request.url = request.url.replace(regex, '');
              }
              if (data) {
                request.data = {
                  data: data
                };
              }
              if (headers) {
                request.headers = headers;
              }
              return request;
            }
          };
          return provider;
        }
      };
    };
    return angular.module('angularModelLayer.providers').provider('$adapter', AdapterProvider);
  })();

}).call(this);

(function() {
  (function() {
    var RegistryProvider;

    RegistryProvider = function() {
      var subscriptions;
      subscriptions = {};

      return {
        $get: [ '$q', '$transport', '$injector', '$filter', '$adapter', '$store', function($q, $transport, $injector, $filter, $adapter, $store) {
            var provider;
            provider = {
              find: function(model_name, id, options = {}) {
                var model;
                model = this.newModel(model_name, {
                  id: parseInt(id)
                }, options);
                model.$fetch(options);
                return model;
              },

              findAll: function(model_name, filter = {}, collection_params = {}) {
                var collection;
                collection = this.newCollection(model_name, filter, collection_params, this.filter(model_name, filter.params, angular.extend({}, filter.options, collection_params)));
                if (!('fetch' in collection_params) || collection_params.fetch) {
                  collection.$fetch();
                }
                return collection;
              },

              fetchModel: function(model, options = {}) {
                var promise;
                promise = $store.fetchItem(model.name.pluralize(), model.url, model.attrs.id, options);
                return promise;
              },

              fetchCollection: function(collection, additional) {
                var promise;
                promise = $store.fetchItems(collection.name, collection.url, collection.filter, angular.extend({}, collection.options, additional));
                return promise;
              },

              saveModel: function(model, options = {}) {
                var data, promise;

                if (options.fields) {
                  data = {};
                  options.fields.each(function(key) {
                    return data[key] = model.attrs[key];
                  });
                } else {
                  data = model.diff();
                }
                if (!model.attrs.id) {
                  promise = $store.save(model.name.pluralize(), model.url, 'POST', {}, model.attrs);
                } else if (options.create) {
                  promise = $store.save(model.name.pluralize(), model.url, 'POST', {}, data);
                } else if (model.attrs.id) {
                  promise = $store.save(model.name.pluralize(), model.url, 'PATCH', {
                    id: model.attrs.id
                  }, data);
                }
                return promise;
              },

              customRequest: function(url, method, params, data) {
                var promise;
                promise = $store.request(url, method, params, data);
                return promise;
              },

              destroyModel: function(model) {
                var promise;
                promise = $store.destroy(model.name.pluralize(), model.url, model.attrs.id);
                return promise;
              },

              wrapModel: function(model_name, attributes, options) {
                var model, model_class;
                model_class = $injector.get(`${model_name.singularize().camelize()}Model`);
                model = new model_class(attributes, options);
                return model;
              },

              newModel: function(model_name, attributes) {
                var model;
                model = this.wrapModel(model_name, attributes);
                return model;
              },

              newCollection: function(model_name, filter = {}, collection_params = {}, models = []) {
                var change_data_callback, collection, collection_class, destroy_data_callback, new_data_callback;
                collection_class = $injector.get(`${model_name.camelize()}Collection`);
                collection = new collection_class(models, {
                  filter: filter.params,
                  options: filter.options,
                  params: collection_params
                });
                if (!('events' in collection_params) || collection_params.events) {
                  new_data_callback = this.on('new:data', (container) => {
                    return collection.$add(this.wrapModel(container.model_name, container.attrs, {
                      permissions: container.permissions
                    }), {
                      event: true
                    });
                  });
                  change_data_callback = this.on('change:data', (container) => {
                    return collection.$add(this.wrapModel(container.model_name, container.attrs, {
                      permissions: container.permissions
                    }), {
                      event: true
                    });
                  });
                  destroy_data_callback = this.on('destroy:data', function(container) {
                    return collection.$remove(container.model_name, container.attrs.id, {
                      event: true
                    });
                  });
                  collection.$beforeDestroy(() => {
                    this.off('new:data', new_data_callback);
                    this.off('change:data', change_data_callback);
                    return this.off('destroy:data', destroy_data_callback);
                  });
                }
                return collection;
              },

              on: function(event_name, callback) {
                subscriptions[event_name] || (subscriptions[event_name] = []);
                subscriptions[event_name].push(callback);
                return callback;
              },

              off: function(event_name, callback) {
                var index;
                subscriptions[event_name] || (subscriptions[event_name] = []);
                index = subscriptions[event_name].indexOf(callback);
                if (index !== -1) {
                  return subscriptions[event_name].splice(subscriptions[event_name].indexOf(callback), 1);
                }
              },

              trigger: function(event_name, data) {
                var ref;
                return (ref = subscriptions[event_name]) != null ? ref.each(function(callback) {
                  return callback(data);
                }) : void 0;
              },

              filter: function(model_name, _filter, _options) {
                var results;
                if (_options && !angular.equals(_options, {})) {
                  results = [];
                } else {
                  results = $store.filter(model_name, _filter, _options).map((container) => {
                    return this.wrapModel(model_name, container.attrs, {
                      permissions: container.permissions
                    });
                  });
                }
                return results;
              }
            };

            $store.on('new:data', function(data) {
              return provider.trigger('new:data', data);
            });
            $store.on('change:data', function(data) {
              return provider.trigger('change:data', data);
            });
            $store.on('destroy:data', function(data) {
              return provider.trigger('destroy:data', data);
            });
            return provider;
          }
        ]
      };
    };
    return angular.module('angularModelLayer.providers').provider('$registry', RegistryProvider);
  })();

}).call(this);

(function() {
  (function() {
    var StoreProvider;

    StoreProvider = function() {
      var $containers, items, subscriptions;
      items = {};
      $containers = {};
      subscriptions = {};

      return {
        $get: [ '$filter', '$transport', '$adapter', '$q', 'Container', '$timeout', function($filter, $transport, $adapter, $q, Container, $timeout) {
            var provider;

            provider = {

              add: function(model_name, attributes) {
                var container;
                $containers[model_name] || ($containers[model_name] = []);
                if (attributes.data.id) {
                  container = this.findBy(model_name, {
                    id: attributes.data.id
                  });
                  if (container) {
                    if (!angular.equals(this.diff(container.attrs, attributes.data), {}) || !angular.equals(this.diff(container.permissions, attributes.permissions), {})) {
                      angular.merge(container.attrs, attributes.data);
                      angular.merge(container.permissions, attributes.permissions);
                      this.trigger('change:data', container);
                    }
                  } else {
                    container = new Container(attributes.data, {
                      permissions: attributes.permissions,
                      model_name: model_name
                    });
                    $containers[model_name].push(container);
                    this.trigger('new:data', container);
                  }
                } else {
                  throw new Error('data should contain id');
                }
                return container;
              },

              save: function(model_name, url, method, params, data) {
                var deferred;
                deferred = $q.defer();
                this.request(url, method, params, data).then((response) => {
                  var container;
                  container = this.add(model_name, response.data);
                  return deferred.resolve(container);
                }).catch(function(response) {
                  return deferred.reject(response);
                });
                return deferred.promise;
              },

              destroy: function(model_name, url, id) {
                var container, deferred;
                deferred = $q.defer();
                container = this.findBy(model_name, {
                  id: id
                });
                this.request(url, 'DELETE', {
                  id: id
                }).then((response) => {
                  if (container) {
                    $containers[model_name].splice($containers[model_name].indexOf(container), 1);
                    this.trigger('destroy:data', container);
                  }
                  return deferred.resolve(response);
                }).catch(function(response) {
                  return deferred.reject(response);
                });
                return deferred.promise;
              },

              fetchItem: function(model_name, url, id, options = {}) {
                var container, deferred;
                deferred = $q.defer();
                container = this.findBy(model_name, {
                  id: id
                });
                if (!container || !container.last_update || moment() - container.last_update > 10000 || options.reset) {
                  if (container) {
                    $timeout(function() {
                      return deferred.notify(container);
                    }, 0);
                    container.last_update = moment();
                  }
                  this.request(url, 'GET', {
                    id: id
                  }).then((response) => {
                    container = this.add(model_name, response.data);
                    return deferred.resolve(container);
                  }).catch(function(response) {
                    return deferred.reject(response);
                  });
                } else {
                  deferred.resolve(container);
                }
                return deferred.promise;
              },

              fetchItems: function(model_name, url, filter, options) {
                var containers, deferred;
                deferred = $q.defer();
                if (options) {
                  containers = [];
                } else {
                  containers = this.filter(model_name, filter);
                }
                if (containers.length > 0) {
                  $timeout(function() {
                    return deferred.notify({
                      items: containers,
                      items_count: containers.length
                    });
                  }, 0);
                }
                this.request(url, 'GET', angular.extend({}, filter, options)).then((response) => {
                  items = response.data.items.map((item) => {
                    var container;
                    container = this.add(model_name, item);
                    container.sort_position = item.sort_position;
                    return container;
                  }).unique();
                  return deferred.resolve({
                    items: items,
                    items_count: response.data.items_count
                  });
                }).catch(function(response) {
                  return deferred.reject(reponse);
                });
                return deferred.promise;
              },

              request: function(url, method, params, data, headers) {
                var promise;
                promise = $transport.enqueue($adapter.convert(url, method, params, data, headers));
                return promise;
              },

              findBy: function(model_name, _filter) {
                return this.filter(model_name, _filter).first();
              },

              filter: function(model_name, _filter) {
                return $filter('filter')($containers[model_name], {
                  attrs: _filter
                }, true) || [];
              },

              trigger: function(event_name, data) {
                var ref;
                return (ref = subscriptions[event_name]) != null ? ref.each(function(callback) {
                  return $timeout(function() {
                    return callback(data);
                  });
                }) : void 0;
              },

              on: function(event_name, callback) {
                subscriptions[event_name] || (subscriptions[event_name] = []);
                return subscriptions[event_name].push(callback);
              },

              containers: function() {
                return $containers;
              },

              subscriptions: function() {
                return subscriptions;
              },

              diff: function(original, edited) {
                var diff, key;
                diff = {};
                for (key in edited) {
                  if (!angular.isObject(original[key]) && original[key] !== edited[key]) {
                    diff[key] = edited[key];
                  } else if (angular.isObject(original[key])) {
                    diff[key] = this.diff(original[key], edited[key]);
                  }
                }
                return diff;
              }
            };
            return provider;
          }
        ]
      };
    };
    return angular.module('angularModelLayer.providers').provider('$store', StoreProvider);
  })();

}).call(this);

(function() {
  (function() {
    var TransportProvider;

    TransportProvider = function() {
      var queue;
      queue = [];
      return {
        $get: [ '$http', '$q', '$interval', function($http, $q, $interval) {
            var provider;

            provider = {
              enqueue: function(request) {
                var deferred, enqueued;
                deferred = $q.defer();
                enqueued = {
                  request: request,
                  deferred: deferred
                };
                queue.push(enqueued);
                request.responseType || (request.responseType = 'json');
                this.send(enqueued);
                return deferred.promise;
              },

              send: function(enqueued) {
                enqueued.state = 'pending';
                return $http(enqueued.request).then(function(response) {
                  enqueued.deferred.resolve(response);
                  enqueued.state = 'resolved';
                  return queue.splice(queue.indexOf(enqueued));
                }).catch(function(response) {
                  if ([400, 401, 402, 403, 404, 405, 422, 434].indexOf(response.status) >= 0) {
                    enqueued.deferred.reject(response);
                    queue.splice(queue.indexOf(enqueued));
                  }
                  return enqueued.state = 'failed';
                });
              },

              retry: function() {
                return _.where(queue, {
                  state: 'failed'
                }).forEach(this.send);
              },

              queue: function() {
                return queue;
              }
            };
            $interval(angular.bind(provider, provider.retry), 5000);
            return provider;
          }
        ]
      };
    };
    return angular.module('meetplayApp.providers').provider('$transport', TransportProvider);
  })();

}).call(this);
