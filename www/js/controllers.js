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


  .controller('SideCtlr', function ($scope, $state, AuthService, $ionicPopover) {

    console.log("SIDE CONTROLLER");
    
    /*
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
    */
    $scope.username = AuthService.getUsername();
    $scope.authority = AuthService.getAuthority();
    $scope.username = AuthService.getUsername();
    
    $ionicPopover.fromTemplateUrl('templates/pop-pref.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
      $scope.prefPopover = popover;
    });
    $ionicPopover.fromTemplateUrl('templates/pop-about.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
      $scope.aboutPopover = popover;
    });
    $ionicPopover.fromTemplateUrl('templates/pop-signout.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
      $scope.signoutPopover = popover;
    });
    
    $scope.openPrefPopover = function($event) {
      $scope.prefPopover.show($event);
    };
    $scope.openAboutPopover = function($event) {
      $scope.aboutPopover.show($event);
    };
    $scope.openSignoutPopover = function($event) {
      $scope.signoutPopover.show($event);
      $state.go("auth");
    };
    
  })
  
  .controller('TabCtlr', function ($scope, $ionicHistory) {
    console.log ( "TAB CONTROLLER");
    console.log($ionicHistory.currentStateName());  
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
              if ( !tokens.error_description ) tokens.error_description = "Not Connected" ;
              $scope.authorization.error = true;
              $scope.authorization.statusText = tokens.error + ": " + tokens.error_description ;;
            }
          });
      }
    };
  })

  .controller('AppsCtrl', function ($scope, $state, AuthService, LoadService, $ionicHistory) {

    $scope.add = function (index) {
      
      console.log("Added " + index);
      var appId = $scope.applications[index].appId;
      
      LoadService.app(AuthService.getAccessToken(), appId, function (tokens) {
        
        if ( tokens.formId /*&& tokens.queryId*/ ) {
          
          LoadService.form(AuthService.getAccessToken(), tokens.formId /*,tokens.queryId*/, function (tokens) {
            console.log('Forms');
            console.log( tokens );
            $state.go('tab.search');
          });
          
        }
      });
    };

    LoadService.load(AuthService.getAccessToken(), function (tokens) {
      
      console.log('UserId is ' + tokens.userId);
      
      LoadService.apps(AuthService.getAccessToken(), tokens.userId, function (apps) {
        
        console.log('Applications');
        var appCount = apps.length;
        $scope.applications = apps;
        console.log($ionicHistory.currentStateName());
        tabState = "tab.apps" ;
      
      });
    });       
  })
 
  .controller('SearchCtrl', function ($scope, $state, AuthService, LoadService, SearchService, x2js) {
    
    $scope.formData = LoadService.getFormData() ;

    console.log ( $scope ) ;
    $scope.search = function (form) {
      
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
      <name>CallStartDate</name>
      <operator>BETWEEN</operator>
      <value>2000-01-01</value>
      <value>2016-04-10</value>
    </criterion>
    <criterion>
      <name>CustomerID</name>
      <operator>EQUAL</operator>
      <value></value>
    </criterion>
    <criterion>
      <name>CustomerLastName</name>
      <operator>EQUAL</operator>
      <value></value>
    </criterion>
    <criterion>
      <name>RepresentativeID</name>
      <operator>EQUAL</operator>
      <value></value>
    </criterion>
    <criterion>
      <name>CustomerFirstName</name>
      <operator>EQUAL</operator>
      <value></value>
    </criterion>
  </data>
          */
        
        SearchService.search( AuthService.getAccessToken(), 
                              LoadService.getSearchId(), 
                              LoadService.getResultsId(),
                              payload, 
                              function (tokens) {
          
          console.log('Results');
          console.log ( tokens ) ;
          if (tokens.rows > 0) {
            $state.go('tab.results');
          }
          //else {
          // no results
          //}
        });
      }
    };
  })
  
  .controller('ResultsCtrl', function ($scope, $state, SearchService) {
   
    $scope.data = SearchService.getResults();
    $scope.data.sortOn = $scope.data.columns[0].id ;
    
    $scope.data.sortReverse = false ;
 
    $scope.sortBy =  function (columnId) {
      console.log ( "sorting by column id " + columnId);
      $scope.data.sortOn = columnId ;
      
      $scope.data.sortReverse = ! $scope.data.sortReverse ;
    } ;
     
  })
  .controller('DashCtrl', function ($scope, $state) {
    console.log("Dashboard");
            tabState = "tab.dash" ;
  })

  .controller('CompCtrl', function ($scope, $state) {
    console.log("Compliance");
            tabState = "tab.comp" ;
  })





