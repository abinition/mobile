mobileApp
  .factory('addBasicAuth', function ($base64) {
    return {
      token: function (user, passwd) {
        return {  'Authorization': 'Basic ' + $base64.encode("infoarchive.iawa:secret"),
                  "Content-Type" : "application/x-www-form-urlencoded" 
                };
      }
    }
  })
  .factory('addBearerAuth', function () {
    return {
      token: function (authToken) {
        return { 'Authorization': 'Bearer ' + authToken };
      }
    }
  })
  .factory('addBearerAuth2', function () {
    return {
      token: function (authToken) {
        return { 'Authorization': 'Bearer ' + authToken,  
                 "Content-Type":"application/xml" 
                };
      }
    }
  })
 
  .factory('AuthService', function ($resource, addBasicAuth) {

    var username = "" ;
    var credentials = {
      access_token: "",
      expires_in: "",
      jti : "",
      refresh_token : "",
      scope : "administration compliance search",
      token_type : "bearer"
    };
    
    return {
      getAccessToken: function () { return credentials.access_token },
      getAuthority: function () { return [credentials.scope] },
      getUsername: function () { return username },
      login: function (un, password, payload, callback) {
        username = un;

        var api = $resource(
          'http://localhost:8081/oauth/token',
          {}, 
          {
            'oauth': {
              method: 'POST',
              headers: addBasicAuth.token(username,password),
              transformResponse: function (data, headers) {
                var jsonData = JSON.parse(data); //or angular.fromJson(data)                
                return jsonData;
              }
            }
          });
        api.oauth(
          {},
          payload,
          function (response) {
            credentials = response ;
            callback(response);
          },
          function (err) {
            callback(err);
          }
        );
      }
    }
  })
  .factory('SearchService', function ($resource, $q, addBearerAuth2) {
    
    return {   
      search: function (authToken, searchId, resultsId, payload, callback) {
        var load1 = $resource(
          'http://localhost:8081/restapi/systemdata/searches/:search',
          {search: searchId }, 
          {
            'searches': {
              method: 'POST',
              headers: addBearerAuth2.token(authToken),
              transformResponse: function (data, headers) {

                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                return jsonData;
              }
            }
          });

        var load2 = $resource(
          'http://localhost:8081/restapi/systemdata/result-masters/:result',
          {result: resultsId }, 
          {
            'results': {
              method: 'GET',
              headers: addBearerAuth2.token(authToken),
              transformResponse: function (data, headers) {

                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                return jsonData;
              }
            }
          });
        var promise1 = load1.searches({}, payload).$promise;
        var promise2 = load2.results().$promise;
        
        $q.all([promise1, promise2])
          .then(
            function (results) {
              console.log(results);
              // Extract the column names from results[1]
              // Extract the data from results[0]
              // panels.tabs[0].columns[i].label
              var tokens = {
                "results" : [0,1,2,3]
              };
              callback(tokens);
              
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
  })
  .factory('LoadService', function ($resource, $q, addBearerAuth, x2js) {
    
    var searchId = '' ;
    var formId = '' ;
    var queryId = '' ;
    var userId = '' ;
    var appId = '' ;
    var resultsId = '' ;
        
    return {
      getAppId: function () { return appId },
      getSearchId: function () { return searchId },
      getResultsId: function () { return resultsId },  
      getFormId: function () { return formId },
      getUserId: function () { return userId },
      getQueryId: function () { return queryId },
      load: function (authToken, callback) {
        var load1 = $resource(
          'http://localhost:8081/restapi/services',
          {}, 
          {
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
          {}, 
          {
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
          {}, 
          {
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
            userId = comps[comps.length - 1];
            console.log(userId);
            var tokens = {
              "userId" : userId 
            } ;
            callback(tokens);
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
          { user: userId }, 
          {
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
          { user: userId }, 
          {
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
              appId = comps[comps.length - 1];
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
          { app: appId }, 
          {
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
          { app: appId }, 
          {
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
        
        var load3 = $resource(
          'http://localhost:8081/restapi/systemdata/applications/:app/aics',
          { app: appId }, 
          {
            'aics': {
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
        var promise3 = load3.aics().$promise;
        
        $q.all([promise1, promise2, promise3])
          .then(
          function (results) {
            // Extract out id's we need
            var xform = results[1]._embedded.searches[0]._links["http://identifiers.emc.com/xform"];
            if ( xform ) {
              var href = new URL(xform.href);
              var comps = href.pathname.split('/');
              formId = comps[comps.length - 1];
            }
            var query = results[1]._embedded.searches[0]._links["http://identifiers.emc.com/query"];
            if ( query ) {
              var href = new URL(query.href);
              var comps = href.pathname.split('/');
              queryId = comps[comps.length - 1];
            }
            var result = results[1]._embedded.searches[0]._links["http://identifiers.emc.com/result-master"];
            if ( result ) {
              var href = new URL(result.href);
              var comps = href.pathname.split('/');
              resultsId = comps[comps.length - 1];
            }
            var tokens = {
              "formId": formId,
              "queryId" : queryId,
              "resultsId" : resultsId
            } ;
            callback(tokens);
          },
          function (errorMsg) {
            // if any of the previous promises gets rejected
            // the success callback will never be executed
            // the error callback will be called...
            console.log('An error occurred: ', errorMsg);
          }
          );
      },
      form: function (authToken, formId, queryId, callback) {

        var load1 = $resource(
          'http://localhost:8081/restapi/systemdata/xforms/:form',
          { form: formId }, 
          {
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
          
        var load2 = $resource(
          'http://localhost:8081/restapi/systemdata/queries/:query',
          {query: queryId }, 
          {
            'queries': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {

                var jsonData = JSON.parse(data); //or angular.fromJson(data)
                return jsonData;
              }
            }
          });
        var promise1 = load1.xforms().$promise;
        var promise2 = load2.queries().$promise;
        
        $q.all([promise1,promise2])
          .then(
          function (results) {
            // Extract out the searchId and return it to the caller
            var xml = results[0].form;
            var js = new X2JS();
            var form = js.xml_str2json(xml);
         
            var instances = form.html.head.model.instance;
            var labels = [] ;
            var label = {} ;
            angular.forEach(instances, function (value, key) {
              if ( value._id == "labels") {
                label = value.labels ;
              }
            });
            labels.push ( label ) ;
            
            var searchRef = results[0]._links["http://identifiers.emc.com/search"];
            if ( searchRef ) {
              var href = new URL(searchRef.href);
              var comps = href.pathname.split('/');
              searchId = comps[comps.length - 1];
            }
            
            var tokens = {
              "searchId": searchId,
              "labels": labels 
            } ;
            
            callback(tokens);
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