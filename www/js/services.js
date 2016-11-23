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
 .factory('addBearerAuth3', function () {
    return {
      token: function (authToken) {
        return { 'Authorization': 'Bearer ' + authToken,  
                 "Accept":"*/*" 
                };
      }
    }
  })
  .factory('helper', function() {
    return {
      iconDataType: function iconDataType(label, dataType) {
        var icon ;
        switch (dataType) {
          case 'DATETIME':
            icon = "ion-clock";
            break;
          case 'DATE':
          case 'date':
            icon = "ion-calendar";
            break;
          case 'email':
            icon = "ion-email";
            break;  
          case 'CID':
            icon = "ion-paperclip";
            break;
          case 'INTEGER':
          case 'number':
            icon = "ion-calculator";
            break;
          case 'ID':
            icon = "ion-person";
            break;
          case 'STRING':
          case 'text':
            if (label.indexOf("Phone") != -1)
              icon = "ion-ios-telephone";
            else
              icon = "ion-document-text";
            break ;
          default:
            icon = "ion-document-text";
            break;
        }
        return icon ;
      },

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
          $rootScope.serverURL + 'login',
          {}, 
          {
            'oauth': {
              method: 'POST',
              headers: addBasicAuth.token(username,password),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
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
  .factory('SearchService', function ($resource, $rootScope, $q, helper, addBearerAuth2) {
    
    var data = {} ;
    
    return {
      
      getResults: function () {  return data ; },
      
      search: function (authToken, sId, rId, rsId, payload, callback) {
        
        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/search-compositions/:search',
          {search: sId }, 
          {
            'searches': {
              method: 'POST',
              headers: addBearerAuth2.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });

        var load2 ;
        if ( rId ) {
	        load2 = $resource(
            $rootScope.serverURL + 'restapi/systemdata/result-masters/:result/',
            {result: rId }, 
            {
              'results': {
                method: 'GET',
                headers: addBearerAuth2.token(authToken),
                transformResponse: function (data, headers) {
                      var jsonData = {} ;
                      try {
                        jsonData = JSON.parse(data); //or angular.fromJson(data)   
                        //console.log(jsonData);
                      }
                      catch ( e ) {
                        jsonData = { "error_description": data } ;
                      }
                      return jsonData ;
                }

              }
            });
        }
        else {
          load2 = $resource(
            $rootScope.serverURL + 'restapi/systemdata/search-compositions/:result/result-masters',
            {result: rsId }, 
            {
              'results': {
                method: 'GET',
                headers: addBearerAuth2.token(authToken),
                transformResponse: function (data, headers) {
                      var jsonData = {} ;
                      try {
                        jsonData = JSON.parse(data); //or angular.fromJson(data)   
                        //console.log(jsonData);
                      }
                      catch ( e ) {
                        jsonData = { "error_description": data } ;
                      }
                      return jsonData ;
                }

              }
            });
         }
    
        var promise1 = load1.searches({}, payload).$promise;
        var promise2 = load2.results().$promise;
        
        $q.all([promise1, promise2])
          .then(
            function (results) {
              //comsole.log(results);
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
                  var id_pre = results[1].panels[0].tabs[0].columns[col].name ;
                  var id = id_pre.split(' ').join('_') ;
                  var label = results[1].panels[0].tabs[0].columns[col].label ;      
                  var dt = results[1].panels[0].tabs[0].columns[col].dataType ; 
                  var dataType = helper.iconDataType( label, dt ) ;         
                  data.columns.push ( { "id": id, "name": label, "dataType": dataType } ) ;
                }
              }
              if ( numPanels > 1 ) {
                if ( results[1].panels[1].tabs.length > 0 ) {
                  var numCols = results[1].panels[1].tabs[0].columns.length ;
                  for ( col=0; col<numCols; col++) {                  
                    var id_pre = results[1].panels[1].tabs[0].columns[col].name ;
                    var id = id_pre.split(' ').join('_') ;
                    var label = results[1].panels[1].tabs[0].columns[col].label ;  
                    var dt = results[1].panels[1].tabs[0].columns[col].dataType ;  
                    var dataType = helper.iconDataType( label, dt ) ;       
                    data.side_columns.push ( { "id": id, "name": label, "dataType": dataType } ) ;
                  }
                }
              }
              if ( numPanels > 2 ) {
                if ( results[1].panels[2].tabs.length > 0 ) {
                  var numCols = results[1].panels[2].tabs[0].columns.length ;
                  for ( col=0; col<numCols; col++) {                  
                    var id = results[1].panels[2].tabs[0].columns[col].name ;
                    var label = results[1].panels[2].tabs[0].columns[col].label ;
                    var dt = results[1].panels[2].tabs[0].columns[col].dataType ; 
                    var dataType = helper.iconDataType( label, dt ) ;          
                    data.side_columns.push ( { "id": id, "name": label, "dataType": dataType  } ) ;
                  }
                }
              }
              
              var numRows = results[0]._embedded.results[0].rows.length ;
              for ( row=0; row<numRows; row++ ) {
                var numCols = results[0]._embedded.results[0].rows[row].columns.length ;
                var rowData = {} ;
                for ( col=0; col<numCols; col++) {                  
                  var id_pre  = results[0]._embedded.results[0].rows[0].columns[col].name ;
                  var id = id_pre.split(' ').join('_') ;
                  if ( results[0]._embedded.results[0].rows[row].columns[col].rows ) {
                    var numRows2 = results[0]._embedded.results[0].rows[row].columns[col].rows.length ;
                    for ( var row2=0; row2<numRows2; row2++ ) {
                      var numCols2 = results[0]._embedded.results[0].rows[row].columns[col].rows[row2].columns.length ;
                      for ( var col2=0; col2<numCols2; col2++) {                  
                        var id_pre  = results[0]._embedded.results[0].rows[row].columns[col].rows[0].columns[col2].name ;
                        var id = id_pre.split(' ').join('_') ;
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
              
              //comsole.log ( data ) ;
              
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
  .factory('LoadService', function ($resource, $rootScope, $q,addBearerAuth,addBearerAuth3, helper, x2js) {
    
    /* LoadService variables */
    var searchesId = '' ;     // A group of searches
    var queryId = '' ;        // The query identifier
    var userId = '' ;         // The user id
    var resultId = '' ;       // Search result-master
    var resultsId = '' ;      // Search result-masters
    
    var formId = '' ;         // The search form id
    var formData = [] ;

    var searchesId = '' ;     // A group of searches
    var searchId = '' ;       // A single search id
    var searchData = [] ;

    var appId = '' ;          // The application id
    var appParms = {
      archiveType: '' ,
      category : '',
      description : '',
      name : ''
    } ;

        
    return {
      getAppId: function () { return appId },
      getSearchId: function () { return searchId },
      getResultId: function () { return resultId },  
      getResultsId: function () { return resultsId },  
      getFormId: function () { return formId },
      getSearchesId: function () { return searchesId },
      getAppParms: function () { return appParms },
      getUserId: function () { return userId },
      getQueryId: function () { return queryId },
      getFormData: function () { return formData },
      getSearchData: function() { return searchData },
      load: function (authToken, callback) {

        // Clear
        userId = '' ;
        var load1 = $resource(
          $rootScope.serverURL + 'restapi/services',
          {}, 
          {
            'services': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
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
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
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
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
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
      apps: function (authToken, uId, callback) {

        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/tenants/:user',
          { user: uId }, 
          {
            'tenants': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });

        var load2 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/tenants/:user/applications',
          { user: uId }, 
          {
            'applications': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });

        var promise1 = load1.tenants().$promise;
        var promise2 = load2.applications( /*{'contains': "{&page,size,sort}"}*/).$promise;

        $q.all([promise1, promise2])
          .then(
          function (results) {
            var apps = [];
            //comsole.log(results);
            
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
            jsonData = { "error_description": errorMsg } ;
            callback ( jsonData ) ;
            
          }
          );
      },
      app: function (authToken, aId, callback) {

        // Clear
        formId = '' ;
        searchesId = '' ;
        queryId = '' ;
        resultId = '';
        resultsId = '';
        formData = [] ;
        searchData = [] ;
        appParms = {} ;

        // Set  
        appId = aId ;
            
        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/applications/:app',
          { app: aId }, 
          {
            'application': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });

        var load2 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/applications/:app/searches',
          { app: aId }, 
          {
            'searches': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });
        
        var load3 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/applications/:app/aics',
          { app: aId }, 
          {
            'aics': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });
          
        var promise1 = load1.application().$promise;
        var promise2 = load2.searches().$promise;
        var promise3 = load3.aics().$promise;
        
        $q.all([promise1, promise2, promise3])
          .then(
          function (results) {
            //comsole.log ( results ) ;

            appParms.archiveType = results[0].archiveType ;       
            appParms.name = results[0].name ;    
            appParms.description = results[0].description ;
            appParms.category = results[0].category ;
            
            // Extract out id's we need
            if ( results[1]._embedded ) {
              
              if ( results[1]._embedded.searches ) {
                
                var searchCount = results[1]._embedded.searches.length ;
                
                for ( i=0; i<searchCount; i++ ) {
                
                  var srch = results[1]._embedded.searches[i]._links.self;
                  if ( srch ) {
                    var href = new URL(srch.href);
                    var comps = href.pathname.split('/');
                    searchesId = comps[comps.length - 1];
                  }
                  var query = results[1]._embedded.searches[i]._links["http://identifiers.emc.com/query"];
                  if ( query ) {
                    var href = new URL(query.href);
                    var comps = href.pathname.split('/');
                    queryId = comps[comps.length - 1];
                  }

                  var description = results[1]._embedded.searches[i].description ;
                  if ( !description ) description = "No description supplied" ;
                  var searches = {
                    'searchesId' : searchesId,
                    'queryId' : queryId,
                    'name' : results[1]._embedded.searches[i].name,
                    'state' : results[1]._embedded.searches[i].state, 
                    'description' : description,
                  } ;
                  searchData.push ( searches ) ;
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
            jsonData = { "error_description": errorMsg } ;
            callback ( jsonData ) ;
            
          }
          );
      },
      searches: function (authToken, sId , qId, callback) {

        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/searches/:searches/search-compositions',
          { searches: sId }, 
          {
            'searchCompositions': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });
        /*  
        var load2 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/queries/:query',
          {query: qId }, 
          {
            'queries': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });
        */  
        var promise1 = load1.searchCompositions().$promise;
        /*var promise2 = load2.queries().$promise;*/
        
        $q.all([promise1/*,promise2*/])
          .then(
          function (results) {
                        
            //comsole.log ( results ) ;
                        
            var formRef = results[0]._embedded.searchCompositions[0]._links["http://identifiers.emc.com/xform"];
            //comsole.log( formRef ) ;
            if ( formRef ) {
              var href = new URL(formRef.href);
              var comps = href.pathname.split('/');
              formId = comps[comps.length - 1];
            }

            var result = results[0]._embedded.searchCompositions[0]._links["http://identifiers.emc.com/result-master"];
            if ( result ) {
              var href = new URL(result.href);
              var comps = href.pathname.split('/');
              resultId = comps[comps.length - 1];
            }
            var result = results[0]._embedded.searchCompositions[0]._links["http://identifiers.emc.com/result-masters"];
            if ( result ) {
              var href = new URL(result.href);
              var comps = href.pathname.split('/');
              resultsId = comps[comps.length - 2];
            }
            var tokens = { "formId" : formId, "resultId": resultId, "resultsId": resultsId } ;
            
            callback(tokens);
          },
          function (errorMsg) {
            // if any of the previous promises gets rejected
            // the success callback will never be executed
            // the error callback will be called...
            console.log('An error occurred: ', errorMsg);
            jsonData = { "error_description": errorMsg } ;
            callback ( jsonData ) ;
            
          }
          );
      },
      form: function (authToken, fId, callback) {

        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/xforms/:form',
          { form: fId }, 
          {
            'xforms': {
              method: 'GET',
              headers: addBearerAuth.token(authToken),
              transformResponse: function (data, headers) {
                    var jsonData = {} ;
                    try {
                      jsonData = JSON.parse(data); //or angular.fromJson(data)   
                      //console.log(jsonData);
                    }
                    catch ( e ) {
                      jsonData = { "error_description": data } ;
                    }
                    return jsonData ;
              }

            }
          });
              
        var promise1 = load1.xforms().$promise;
        
        $q.all([promise1])
          .then(
          function (results) {
                  
            //comsole.log ( results ) ;
            var searchRef = results[0]._links["http://identifiers.emc.com/search-composition"];
            if ( searchRef ) {
              var href = new URL(searchRef.href);
              var comps = href.pathname.split('/');
              searchId = comps[comps.length - 1];
            }
            
            // Extract out the searchId and return it to the caller
            var xml = results[0].form;
            //console.log(xml);
            var js = new X2JS();
            var form = js.xml_str2json(xml);
            //console.log ( form );

            var inputs = helper.findNode( "input", form ) ;
            var binds = helper.findNode( "bind", form ) ;
            var hasBinding = ( binds.constructor === Array ) ;

            //comsole.log( inputs ) ;
            var instances = form.html.head.model.instance;
            var labels = {} ;
            var hints = {} ;
            var prompts = {} ;
            var data = {} ;
            if ( instances.constructor === Array ) {
              angular.forEach(instances, function (value, key) {
                
                if ( value._id == "labels") {
                  labels = value.labels ;
                  //comsole.log("labels");
                  //comsole.log(labels);
                }
                else if ( value._id == "hints") {
                  hints = value.hints ;
                }
                else if ( value._id == "prompts") {
                  prompts = value.prompts ;
                }
                else if ( value._id == undefined && value.data ) {
                  data = value.data ;
                }
              });
            }
            else {
              data = instances.data ;
            }
            
            formData = [];
            var i = 0 ;
            //comsole.log ( data ) ;
            for (var key in data) {
              //comsole.log("key")
              //comsole.log(key);
              
              if (data.hasOwnProperty(key)) {
                //comsole.log("has own prop");
                //comsole.log(data[key])
                var range = "" ;
                var dataType = "text" ;
                if ( data[key] instanceof Object || data[key] == "") {
                  if ( data[key] instanceof Object ) {
                    //console.log("range");
                    //console.log(range);
                    if ( hasBinding && data[key]._operator == undefined ) {
                      //console.log("Valid range");
                      range = data[key] ;
                      angular.forEach(range, function (value2, key2) {
                          //console.log("==2==");
                          //console.log(value2);
                          //console.log(key2);
                          angular.forEach(binds, function (value3, key3) {
                            //console.log("==3==");
                            //console.log(value3);
                            //console.log(key3);
                            //console.log("/data/"+key+"/"+key2 );
                            if ( value3._ref == "/data/"+key+"/"+key2 ) {
                              //console.log(value3._type );
                              switch ( value3._type ) {
                                case 'xforms:string' :
                                  dataType = 'text' ;
                                  break;
                               case 'xforms:email' :
                                  dataType = 'email' ;
                                  break;
                               case 'xforms:tel' :
                                  dataType = 'tel' ;
                                  break;
                              case 'xforms:search' :
                                  dataType = 'search' ;
                                  break;
                              case 'xforms:float' :
                              case 'xforms:decimal' :
                              case 'xforms:double' :
                                  dataType = 'number' ;
                                  break;  
                              case 'xforms:date' :
                                  dataType = 'date' ;
                                  break;
                              case 'xforms:gMonth' :
                                  dataType = 'month' ;
                                  break;
                              case 'xforms:password' :
                                  dataType = 'password' ;
                                  break; 
                              }
                            }
                          });
                      });
                    }
                  }
                  if ( labels[key] && labels[key] != "" ) {
                    data[key] = labels[key] ;
                    //comsole.log("label = "+labels[key]);
                  }
                  else {
                    //comsole.log("inputs");
                    //comsole.log(inputs);
                    if ( inputs._ref && inputs._ref == key ) {
                        //comsole.log("ref = "+key);
                        data[key] = key
                    }
                    else {
                      //comsole.log("search inputs");
                      for (i=0; i<inputs.length; i++ ) {
                        //comsole.log(inputs[i]._bind);
                        if ( inputs[i]._bind &&
                             inputs[i]._bind == key ) {
                          data[key] = inputs[i].label.__text ;
                          //comsole.log("text="+inputs[i].label.__text);
                          break ;
                        }
                        else if ( inputs[i]._ref == key ) {
                          data[key] = key
                          break ;
                        }
                      }
                    }
                  }
                }
                //comsole.log("ready");
                //comsole.log(data[key]);
                var label = data[key] ;
                var input = {
                  "id" : key,
                  "label" : label,
                  "type" : dataType,
                  "class" : helper.iconDataType( label, dataType ),
                  "range" : range,
                  "prompts" : prompts[key]
                };
                formData.push ( input ) ;
              }
              else {
                //comsole.log("does not have own property")
              }
            }
            //console.log ( "Callback to "+callback ) ;
            callback(formData);
          },
          function (errorMsg) {
            // if any of the previous promises gets rejected
            // the success callback will never be executed
            // the error callback will be called...
            console.log('An error occurred: ', errorMsg);
            jsonData = { "error_description": errorMsg } ;
            callback ( jsonData ) ;
          }
          );
      },
      download: function (authToken, aId, cId, fn, callback) {

        var load1 = $resource(
          $rootScope.serverURL + 'restapi/systemdata/applications/:app/ci?cid=' + cId,
          { app: aId }, 
          {
            'download': {
              method: 'GET',
              headers: addBearerAuth3.token(authToken),
              transformResponse: function(data, headersGetter) {
                headers = headersGetter() ;
                // Stores the ArrayBuffer object in a property called "data"
                return { data : data, type:  headers['content-type'] } ;
              }
            }
          });
              
        load1.download().$promise.then(
          function (results) {
            //comsole.log(results);
            var arr = new Array ( results.data ) ;
                var blob = new Blob ( arr, {'type': results.type} );
            var fileSpec = {
              "name" : fn,
              "data" : blob
            } ;
           
            callback(fileSpec);
          },
          function (errorMsg) {
            // if any of the previous promises gets rejected
            // the success callback will never be executed
            // the error callback will be called...
            console.log('An error occurred: ', errorMsg);
            jsonData = { "error_description": errorMsg } ;
            callback ( jsonData ) ;
            
          }
          );
      }
    }
  });