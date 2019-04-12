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
