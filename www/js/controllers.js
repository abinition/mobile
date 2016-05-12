mobileApp

  .controller('LoadingCtrl', function ($scope, $ionicLoading) {

    $scope.show = function () {
      $ionicLoading.show({
        template: 'Loading...'
      });
    };
    $scope.hide = function () {
      $ionicLoading.hide();
    }
  })

  .controller('NavCtlr', function ($scope, $ionicSideMenuDelegate, AuthService ) {
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.username = AuthService.getUsername();
  })

  .controller('MenuCtlr', function ($scope,$state) {
            $state.go('menu.pref');
  })
  
  .controller('AuthCtrl', function ($scope, $state, AuthService) {
    
    $scope.authorization = {
      username: '',
      password: '',
      language: 'en',
      statusText: 'Unknown error',
      access_token : ''
    };

    $scope.payload = function(obj) {
        var str = [];
        for(var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        return str.join("&");
    } ;
        
    $scope.signIn = function (form) {
      
      if (form.$valid) {

        console.log("Authenticating");
        console.log($scope.authorization);        
        
        var postData = {
            "grant_type": "password",
            "username" : $scope.authorization.username,
            "password" : $scope.authorization.password,
            "client_id" : "infoarchive.iawa",
            "client_secret" : "secret",
            "scope" : "search compliance administration"
        } ;
        
        
        AuthService.login(  $scope.authorization.username, 
                            $scope.authorization.password,
                            $scope.payload(postData), 
          function (tokens) {
            if (tokens.access_token) {
              console.log("Returned token is " + tokens.access_token);
              $scope.authorization.error = false;
              $scope.authorization.access_token = tokens.access_token;
              $state.go('tab.apps');
           }
            else {
              if ( !tokens.error ) tokens.error = "Error" ;
              if ( !tokens.error_description ) tokens.error_description = "Unknown" ;
              $scope.authorization.error = true;
              $scope.authorization.statusText = tokens.error + ":" + tokens.error_description ;;
            }
          });
      }
    };
  })

  .controller('AppsCtrl', function ($scope, $state, AuthService, LoadService) {

    $scope.add = function (index) {
      console.log("Added " + index);
      var appId = $scope.applications[index].appId;
      LoadService.app(AuthService.getAccessToken(), appId, function (formId) {
        console.log('FormId is ' + formId);
        if ( formId ) {
          LoadService.form(AuthService.getAccessToken(), formId, function (form) {
            console.log('Forms');
            console.log(form);
            $state.go('tab.search');
          });
        }
      });
    };

    LoadService.load(AuthService.getAccessToken(), function (userId) {
      console.log('UserId is ' + userId);
      LoadService.apps(AuthService.getAccessToken(), userId, function (apps) {
        console.log('Applications');
        var appCount = apps.length;
        $scope.applications = apps;
      });
    });
  })

  .controller('SearchCtrl', function ($scope, $state, AuthService, LoadService, SearchService, x2js) {
    
    $scope.search = {
      lastname: '',
      firstname: ''
    };

    $scope.signIn = function (form) {
      console.log ( form ) ;
      
      if (form.$valid) {

        var preload = {
          "data": {
            "criterion": [
              {
                "name": "CustomerLastName",
                "operator": "EQUAL",
                "value" : ""
              },
              {
                "name": "CustomerFirstName",
                "operator": "EQUAL",
                "value" : ""
              }
            ],
            "order-by": {
              "name": "CustomerLastName",
              "direction": "ASCENDING"
            }
          }
        } ;
        var xml = new X2JS();
        var payload = xml.json2xml_str ( preload ) ;
            /*
            <data>
              <criterion>
                <name>CustomerLastName</name>
                <operator>EQUAL</operator>
                <value></value>
             </criterion>
             <criterion>
                <name>CustomerFirstName</name>
                <operator>EQUAL</operator>
                <value></value>
             </criterion>
             <order-by>
                <name>CustomerLastName</name>
                <direction>ASCENDING</direction>
             </order-by>
           </data>
          */
        
        SearchService.search( AuthService.getAccessToken(), 
                              LoadService.getSearchId(), 
                              LoadService.getQueryId(),
                              payload, 
                              function (tokens) {
          console.log('done');
          if (tokens.results) {
            
            $state.go('tab.results');
          }
          else {

          }
        });
      }
    };
  })
  
  .controller('DashCtrl', function ($scope, $state) {
    console.log("Dashboard");
  })

  .controller('CompCtrl', function ($scope, $state) {
    console.log("Compliance");
  })

  .controller('AboutCtrl', function ($scope, $state) {
    console.log("About");
  })

  .controller('PrefCtrl', function ($scope, $state, AuthService) {
    console.log("Prefs");
    $scope.authority = AuthService.getAuthority();
    $scope.username = AuthService.getUsername();
  })

  .controller('SignoutCtrl', function ($scope, $state) {
    console.log("Signout");
  });


