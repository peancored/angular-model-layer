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
