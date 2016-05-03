mobileApp
  .factory('addBasicAuth', function ($base64) {
    return {
      token: function (user, passwd) {
        return { 'Authorization': 'Basic ' + $base64.encode(user + ':' + passwd) };
      }
    }
  })
  .factory('addBearerAuth', function ($base64) {
    return {
      token: function (authToken) {
        return { 'Authorization': 'Bearer ' + authToken };
      }
    }
  })
  .factory('AuthService', function ($resource, addBasicAuth) {
    var authToken = '';
    var authority = [] ;
    return {
      getAuthToken: function () { return authToken },
      getAuthority: function () { return authority },
      login: function (username, password, callback) {
        var api = $resource(
          'http://localhost:8081/user',
          {}, {
            'query': {
              method: 'GET',
              headers: addBasicAuth.token(username, password),
              transformResponse: function (data, headers) {

                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                var results = {} ;
                if ( jsonData.length > 0 ) {
                  results.authority = [ jsonData[0].authority, jsonData[1].authority ]  ;
                }
                results.authToken = headers('x-auth-token'); ;
                return results;
              }
            }
          });
        api.query(
          function (response) {
            authToken = response.authToken;
            authority = response.authority ;
            callback(response);
          },
          function (err) {
            callback(err);
          }
        );
      }
    }
  })
  .factory('LoadService', function ($resource, $q, addBearerAuth) {
    return {
      load: function (authToken, callback) {
        console.log("Loading...");
        var load1 = $resource(
          'http://localhost:8081/restapi/services',
          {}, {
            'services': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                console.log(jsonData);
                return jsonData;
              }
            }
          });

        var load2 = $resource(
          'http://localhost:8081/restapi/product-info',
          {}, {
            'productInfo': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                console.log(jsonData);
                return jsonData;
              }
            }
          });

        var load3 = $resource(
          'http://localhost:8081/restapi/systemdata/tenants',
          {}, {
            'tenants': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                console.log(jsonData);
                return jsonData;
              }
            }
          });

        var promise1 = load1.services().$promise;
        var promise2 = load2.productInfo().$promise;
        var promise3 = load3.tenants().$promise;

        $q.all([promise1, promise2, promise3])
          .then(
            function (results) {
              // Extract out the userId and return it to the caller
              var href = new URL(results[2]._embedded.tenants[0]._links.self.href);
              var comps = href.pathname.split('/');
              var userId = comps[comps.length - 1];
              console.log(userId);
              callback(userId);
            },
            function (errorMsg) {
              // if any of the previous promises gets rejected
              // the success callback will never be executed
              // the error callback will be called...
              console.log('An error occurred: ', errorMsg);
           }
        );
      },
      apps: function (authToken, userId, callback) {

        var load1 = $resource(
          'http://localhost:8081/restapi/systemdata/tenants/:user',
          { user: userId }, {
            'tenants': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                console.log(jsonData);
                return jsonData;
              }
            }
          });

        var load2 = $resource(
          'http://localhost:8081/restapi/systemdata/tenants/:user/applications',
          { user: userId }, {
            'applications': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                console.log(jsonData);
                return jsonData;
              }
            }
          });

        var promise1 = load1.tenants().$promise;
        var promise2 = load2.applications( /*{'contains': "{&page,size,sort}"}*/).$promise;

        $q.all([promise1, promise2])
          .then(
            function (results) {
              var apps = [] ;
              var appCount = results[1]._embedded.applications.length ;
              for ( i=0; i<appCount; i++ ) {
                var href = new URL ( results[1]._embedded.applications[i]._links.self.href ) ;
                var comps = href.pathname.split('/');
                var appId = comps[comps.length - 1];
                apps.push ( new Object ( { app: appId } ) ) ;
              }
              callback(apps);
            },
            function (errorMsg) {
              // if any of the previous promises gets rejected
              // the success callback will never be executed
              // the error callback will be called...
              console.log('An error occurred: ', errorMsg);
            }
        );
      }
    }
  });