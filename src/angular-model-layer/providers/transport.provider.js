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
