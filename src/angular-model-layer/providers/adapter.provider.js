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
