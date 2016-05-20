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
    
    var data = {} ;
    
    return {
      
      getResults: function () { 
        return data ;
      },
      
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
              // results[1].panels[0] <-- Main Table
              //    panels[0].tabs[0].columns.name .label .datatype 
              // results[1].panels[1] <-- Inline panel
              // results[1].panels[2] <-- Side panel
              //
              // Extract the data from results[0]
              /*
                  "_embedded" : {
                     "results" : [ {
                      "rows" : [ {
                        "columns" : [ {
                          "name" : "SentToArchiveDate",
                          "value" : "2005-12-01"
                          
                           $scope.data.columns = [{"id":"1453","name":"Product"},{"id":"1355","name":"Weight"},{"id":"0393","name":"Height"},{"id":"3932","name":"Width"},{"id":"2939","name":"Depth"},{"id":"1234","name":"Color"}];
    
  $scope.data.items = [{"1234":"Pink","1355":"21 oz.","1453":"ea","2939":"3 in.","3932":"29  in.","0393":"12  in."},{"1234":"Black","1355":
               */
              data = {
                columns: [],
                items: []
              } ;

              var numCols = results[1].panels[0].tabs[0].columns.length ;
              for ( col=0; col<numCols; col++) {                  
                var id = results[1].panels[0].tabs[0].columns[col].name ;
                var label = results[1].panels[0].tabs[0].columns[col].label ;
                data.columns.push ( { "id": id, "name": label } ) ;
              }

              
              var numRows = results[0]._embedded.results[0].rows.length ;
              for ( row=0; row<numRows; row++ ) {
                var numCols = results[0]._embedded.results[0].rows[row].columns.length ;
                var rowData = {} ;
                for ( col=0; col<numCols; col++) {                  
                  var id = results[0]._embedded.results[0].rows[0].columns[col].name ;
                  var val = results[0]._embedded.results[0].rows[row].columns[col].value ;
                  rowData[id] = val ;
                }
                data.items.push ( rowData ) ;
              }
              
              console.log ( data ) ;
              var tokens = { "rows": numRows } ;
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
    var formData = [] ;
        
    return {
      getAppId: function () { return appId },
      getSearchId: function () { return searchId },
      getResultsId: function () { return resultsId },  
      getFormId: function () { return formId },
      getUserId: function () { return userId },
      getQueryId: function () { return queryId },
      getFormData: function () { return formData },
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

        formId = '' ;
        queryId = '' ;
        resultsId = '';
        formData = [] ;
            
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
            console.log ( results ) ;

            // Extract out id's we need
            if ( results[1]._embedded ) {
              if ( results[1]._embedded.searches ) {
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
              }
            }
            var tokens = {
              "formId": formId,
              "queryId" : queryId,
              "resultsId" : resultsId
            } ;
            formData = [] ;
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
      form: function (authToken, formId /*, queryId*/, callback) {

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
          /*
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
          */
        var promise1 = load1.xforms().$promise;
        //var promise2 = load2.queries().$promise;
        
        $q.all([promise1/*,promise2*/])
          .then(
          function (results) {
            
                        
            var searchRef = results[0]._links["http://identifiers.emc.com/search"];
            if ( searchRef ) {
              var href = new URL(searchRef.href);
              var comps = href.pathname.split('/');
              searchId = comps[comps.length - 1];
            }
            
            // Extract out the searchId and return it to the caller
            var xml = results[0].form;
            var js = new X2JS();
            var form = js.xml_str2json(xml);
            console.log ( form );
            
            var inputs = form.html.body.input ;
            var instances = form.html.head.model.instance;
            var labels = {} ;
            var data = {} ;
            if ( instances.constructor === Array ) {
              angular.forEach(instances, function (value, key) {
                
                if ( value._id == "labels") {
                  labels = value.labels ;
                }
                else if ( value.data ) {
                  data = value.data ;
                }
              });
            }
            else {
              data = instances.data ;
              labels = data ; 
              var i = 0 ;
              for (var key in labels) {
                if (labels.hasOwnProperty(key)) {
                  if ( labels[key] == "") labels[key] = inputs[i++].label.__text ;
                }
              }
            }

            formData = [];
            var i = 0 ;
            for (var key in labels) {
              if (labels.hasOwnProperty(key)) {
                if ( labels[key] == "") labels[key] = inputs[i++].label.__text ;
              }
              var input = {
                "id" : key,
                "label" : labels[key],
                "type" : "text"
              };
              formData.push ( input ) ;
            }
          
            callback(formData);
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