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
        return { 'Authorization': 'Bearer ' + authToken,
                 'Accept' : 'application/hal+json' };
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
  .factory('helper', function() {
    return {
      findNode: function findNode(id, currentNode) {
        var i,
            currentChild,
            result;

        if (id == currentNode.id) {
          
            return currentNode;
        } 
        else { 

            // Use a for loop instead of forEach to avoid nested functions
            // Otherwise "return" will not work properly
     
            if ( currentNode instanceof Array ) {
              for (i = 0; i < currentNode.length; i += 1) {
                  currentChild = currentNode[i];
                  // Search in the current child
                  result = findNode(id, currentChild);
                  // Return the result if the node has been found
                  if (result !== false)  return result;
              }
            }
            else {
              for (var key in currentNode){
                if ( key == 0) return false ;
                if (id == key) return currentNode[key] ;
                
                if  ( currentNode.hasOwnProperty(key)) {
                  //recursive call 
                  result = findNode(id, currentNode[key]);
                  // Return the result if the node has been found
                  if (result !== false)  return result;
                }                
              }
            }
            // The node has not been found and we have no more options
            return false;
        }
      }
    }
  })
  .factory('AuthService', function ($resource, $rootScope, addBasicAuth) {

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
          $rootScope.serverURL + 'oauth/token',
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
  .factory('ResultsService', function () {
    
    var results = {} ;
    return {
      setResults: function (item) {
        results = item ;
      },
      getResults: function () {
        return results ;
      }
    }
  })
  .factory('SearchService', function ($resource, $rootScope, $q, addBearerAuth2) {
    
    var data = {} ;
    
    return {
      
      getResults: function () {  return data ; },
      
      search: function (authToken, searchId, resultsId, payload, callback) {
        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/searches/:search',
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
          $rootScope.serverURL + 'restapi/systemdata/result-masters/:result',
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
              data = {
                columns: [],
                items: [],
                side_columns: []
              } ;
              var numPanels = results[1].panels.length ;
              if ( results[1].panels[0].tabs.length > 0 ) {
                var numCols = results[1].panels[0].tabs[0].columns.length ;
                for ( col=0; col<numCols; col++) {                  
                  var id = results[1].panels[0].tabs[0].columns[col].name ;
                  var label = results[1].panels[0].tabs[0].columns[col].label ;           
                
                  data.columns.push ( { "id": id, "name": label } ) ;
                }
              }
              if ( numPanels > 1 ) {
                if ( results[1].panels[1].tabs.length > 0 ) {
                  var numCols = results[1].panels[1].tabs[0].columns.length ;
                  for ( col=0; col<numCols; col++) {                  
                    var id = results[1].panels[1].tabs[0].columns[col].name ;
                    var label = results[1].panels[1].tabs[0].columns[col].label ;       
                    data.side_columns.push ( { "id": id, "name": label} ) ;
                  }
                }
              }
              if ( numPanels > 2 ) {
                if ( results[1].panels[2].tabs.length > 0 ) {
                  var numCols = results[1].panels[2].tabs[0].columns.length ;
                  for ( col=0; col<numCols; col++) {                  
                    var id = results[1].panels[2].tabs[0].columns[col].name ;
                    var label = results[1].panels[2].tabs[0].columns[col].label ;       
                    data.side_columns.push ( { "id": id, "name": label } ) ;
                  }
                }
              }
              
              var numRows = results[0]._embedded.results[0].rows.length ;
              for ( row=0; row<numRows; row++ ) {
                var numCols = results[0]._embedded.results[0].rows[row].columns.length ;
                var rowData = {} ;
                for ( col=0; col<numCols; col++) {                  
                  var id  = results[0]._embedded.results[0].rows[0].columns[col].name ;
                  if ( results[0]._embedded.results[0].rows[row].columns[col].rows ) {
                    var numRows2 = results[0]._embedded.results[0].rows[row].columns[col].rows.length ;
                    for ( var row2=0; row2<numRows2; row2++ ) {
                      var numCols2 = results[0]._embedded.results[0].rows[row].columns[col].rows[row2].columns.length ;
                      for ( var col2=0; col2<numCols2; col2++) {                  
                        var id  = results[0]._embedded.results[0].rows[row].columns[col].rows[0].columns[col2].name ;
                        var val = results[0]._embedded.results[0].rows[row].columns[col].rows[row2].columns[col2].value ;
                        //console.log ( id + " = " + val ) ;
                        rowData[id] = val ;
                      }
                    }
                  }
                  else {
                    var val = results[0]._embedded.results[0].rows[row].columns[col].value ;
                    if ( val == undefined ) val = "" ;
                    rowData[id] = val ;
                  }
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
  .factory('LoadService', function ($resource, $rootScope, $q, addBearerAuth, helper, x2js) {
    
    var searchId = '' ;
    var formId = '' ;
    var queryId = '' ;
    var userId = '' ;
    var appId = '' ;
    var resultsId = '' ;
    var archiveType = '' ;
    var formData = [] ;
    var searchData = [] ;
    var appParms = {
      archiveType: '' ,
      category : '',
      description : '',
      name : ''
    } ;

        
    return {
      getAppId: function () { return appId },
      getSearchId: function () { return searchId },
      getResultsId: function () { return resultsId },  
      getFormId: function () { return formId },
      getAppParms: function () { return appParms },
      getUserId: function () { return userId },
      getQueryId: function () { return queryId },
      getFormData: function () { return formData },
      getSearchData: function() { return searchData },
      load: function (authToken, callback) {
        var load1 = $resource(
          $rootScope.serverURL + 'restapi/services',
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
          $rootScope.serverURL + 'restapi/product-info',
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
          $rootScope.serverURL + 'restapi/systemdata/tenants',
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
          $rootScope.serverURL + 'restapi/systemdata/tenants/:user',
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
          $rootScope.serverURL + 'restapi/systemdata/tenants/:user/applications',
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

        // Clear
        formId = '' ;
        queryId = '' ;
        resultsId = '';
        formData = [] ;
        searchData = [] ;
        appParms = {} ;
            
        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/applications/:app',
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
          $rootScope.serverURL + 'restapi/systemdata/applications/:app/searches',
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
          $rootScope.serverURL + 'restapi/systemdata/applications/:app/aics',
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

            appParms.archiveType = results[0].archiveType ;       
            appParms.name = results[0].name ;    
            appParms.description = results[0].description ;
            appParms.category = results[0].category ;
            
            // Extract out id's we need
            if ( results[1]._embedded ) {
              
              if ( results[1]._embedded.searches ) {
                
                var searchCount = results[1]._embedded.searches.length ;
                
                for ( i=0; i<searchCount; i++ ) {
                
                  var xform = results[1]._embedded.searches[i]._links["http://identifiers.emc.com/xform"];
                  if ( xform ) {
                    var href = new URL(xform.href);
                    var comps = href.pathname.split('/');
                    formId = comps[comps.length - 1];
                  }
                  var query = results[1]._embedded.searches[i]._links["http://identifiers.emc.com/query"];
                  if ( query ) {
                    var href = new URL(query.href);
                    var comps = href.pathname.split('/');
                    queryId = comps[comps.length - 1];
                  }
                  var result = results[1]._embedded.searches[i]._links["http://identifiers.emc.com/result-master"];
                  if ( result ) {
                    var href = new URL(result.href);
                    var comps = href.pathname.split('/');
                    resultsId = comps[comps.length - 1];
                  }
                  var description = results[1]._embedded.searches[i].description ;
                  if ( !description ) description = "No description supplied" ;
                  var search = {
                    'formId' : formId,
                    'queryId' : queryId,
                    'resultsId' : resultsId,
                    'name' : results[1]._embedded.searches[i].name,
                    'state' : results[1]._embedded.searches[i].state, 
                    'description' : description,
                  } ;
                  searchData.push ( search ) ;
                }
              }
            }
            callback(searchData);
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
          $rootScope.serverURL + 'restapi/systemdata/xforms/:form',
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
          $rootScope.serverURL + 'restapi/systemdata/queries/:query',
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
            
            var inputs = helper.findNode( "input", form ) ;
             
            console.log( inputs ) ;
            var instances = form.html.head.model.instance;
            var labels = {} ;
            var hints = {} ;
            var prompts = {} ;
            var data = {} ;
            if ( instances.constructor === Array ) {
              angular.forEach(instances, function (value, key) {
                
                if ( value._id == "labels") {
                  labels = value.labels ;
                }
                else if ( value._id == "hints") {
                  hints = value.hints ;
                }
                else if ( value._id == "prompts") {
                  prompts = value.prompts ;
                }
                else if ( value.data ) {
                  data = value.data ;
                }
              });
            }
            else {
              data = instances.data ;
            }
            
            formData = [];
            var i = 0 ;
            console.log ( data ) ;
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                var range = "" ;
                if ( data[key] instanceof Object || data[key] == "") {
                  if ( data[key] instanceof Object ) {
                    range = data[key] ;
                  }
                  if ( labels[key] && labels[key] != "" ) {
                    data[key] = labels[key] ;
                  }
                  else {
                    for (i=0; i<inputs.length; i++ ) {
                      console.log(inputs[i]._bind);
                      if ( inputs[i]._bind == key ) {
                        data[key] = inputs[i].label.__text ;
                        break ;
                      }
                    }
                  }

                }
                var input = {
                  "id" : key,
                  "label" : data[key],
                  "type" : "text",
                  "range" : range,
                  "prompts" : prompts[key]
                };
                formData.push ( input ) ;
              }
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