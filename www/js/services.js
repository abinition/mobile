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
    var authority = [];
    var username = '';

    return {
      getAuthToken: function () { return authToken },
      getAuthority: function () { return authority },
      getUsername: function () { return username },
      login: function (un, password, callback) {
        username = un;
        var api = $resource(
          'http://localhost:8081/user',
          {}, {
            'query': {
              method: 'GET',
              headers: addBasicAuth.token(username, password),
              transformResponse: function (data, headers) {

                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                var results = {};
                if (jsonData.length > 0) {
                  results.authority = [jsonData[0].authority, jsonData[1].authority];
                }
                results.authToken = headers('x-auth-token');;
                return results;
              }
            }
          });
        api.query(
          function (response) {
            authToken = response.authToken;
            authority = response.authority;
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
            var apps = [];
            console.log(results);
            var appCount = results[1]._embedded.applications.length;
            for (i = 0; i < appCount; i++) {
              var href = new URL(results[1]._embedded.applications[i]._links.self.href);
              var comps = href.pathname.split('/');
              var appId = comps[comps.length - 1];
              apps.push(new Object({
                appId: appId,
                name: results[1]._embedded.applications[i].name,
                category: results[1]._embedded.applications[i].category,
                description: results[1]._embedded.applications[i].description,
                state: results[1]._embedded.applications[i].state
              }));
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
      },
      app: function (authToken, appId, callback) {

        var load1 = $resource(
          'http://localhost:8081/restapi/systemdata/applications/:app',
          { app: appId }, {
            'application': {
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
          'http://localhost:8081/restapi/systemdata/applications/:app/searches',
          { app: appId }, {
            'searches': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                console.log(jsonData);
                return jsonData;
              }
            }
          });

        var promise1 = load1.application().$promise;
        var promise2 = load2.searches().$promise;

        $q.all([promise1, promise2])
          .then(
          function (results) {
            // Extract out the searchId and return it to the caller
            var formId = 0 ;
            var xform = results[1]._embedded.searches[0]._links["http://identifiers.emc.com/xform"];
            if ( xform ) {
              var href = new URL(xform.href);
              var comps = href.pathname.split('/');
              var formId = comps[comps.length - 1];
            }
            callback(formId);
          },
          function (errorMsg) {
            // if any of the previous promises gets rejected
            // the success callback will never be executed
            // the error callback will be called...
            console.log('An error occurred: ', errorMsg);
          }
          );
      },
      form: function (authToken, formId, callback) {

        var load1 = $resource(
          'http://localhost:8081/restapi/systemdata/xforms/:form',
          { form: formId }, {
            'xforms': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                console.log(jsonData);
                return jsonData;
              }
            }
          });

        var promise1 = load1.xforms().$promise;

        $q.all([promise1])
          .then(
          function (results) {
            // Extract out the searchId and return it to the caller
            var xml = results[0].form;
            var x2js = new X2JS();
            var form = x2js.xml_str2json(xml);
         
            var instances = form.html.head.model.instance;
            var search = [] ;
            var labels = {} ;
            angular.forEach(instances, function (value, key) {
              if ( value._id == "labels") {
                labels = value.labels ;
              }
            });
            search.push ( labels ) ;
            var searchId = 0;
            var searchRef = results[0]._links["http://identifiers.emc.com/search"];
            if ( searchRef ) {
              var href = new URL(searchRef.href);
              var comps = href.pathname.split('/');
              var searchId = comps[comps.length - 1];
            }
            search.push ( {"searchId:": searchId});
            callback(search);
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