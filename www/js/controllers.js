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


  .controller('SideCtlr', function ($scope, $state, $rootScope,AuthService, $ionicPopover, $ionicModal, $localStorage, $sessionStorage) {

    console.log("SIDE CONTROLLER");

    /*
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
    */
    $scope.username = AuthService.getUsername();
    $scope.authority = AuthService.getAuthority();
    $scope.username = AuthService.getUsername();
    $scope.settings  = {
      "server" : $localStorage.server 
    };

    $ionicModal.fromTemplateUrl('templates/modal-settings.html', {
      animation: 'slide-in-up',
      scope: $scope
    })
    .then(function (modal) {
      $scope.modal = modal;
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

    $scope.openSettingsModal = function ($event) {
      $scope.modal.show($event);
    };

    $scope.saveSettings = function (settingsForm) {
      if (settingsForm.$valid) {
        $localStorage.server = $scope.settings.server ;
        $rootScope.server = $scope.settings.server ;
      }
      $scope.modal.hide();
    };

    $scope.cancelSettings = function () {
      console.log("cancelled");
      $scope.modal.hide();
    };

    $scope.openAboutPopover = function ($event) {
      $scope.aboutPopover.show($event);
    };

    $scope.openSignoutPopover = function ($event) {
      $scope.signoutPopover.show($event);
      $state.go("auth");
    };

  })

  .controller('TabCtlr', function ($scope, $ionicHistory) {
    console.log("TAB CONTROLLER");
    console.log($ionicHistory.currentStateName());
  })

  .controller('AuthCtrl', function ($scope, $state, $localStorage, $rootScope, AuthService) {

    $scope.authorization = {
      username: '',
      password: '',
      language: 'en',
      statusText: 'Unknown error',
      access_token: ''
    };

    $scope.payload = function (obj) {
      var str = [];
      for (var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
    };
    
    if ( angular.isUndefined ( $localStorage.server ) ) {                       
        $localStorage = $localStorage.$default({server: "http://localhost:8081/"}); 
    }
    
    $scope.signIn = function (form) {

      if (form.$valid) {

        console.log("Authenticating");
        console.log($scope.authorization);
        $rootScope.server = "http://localhost:8081/" ; //$localStorage.server  ;
    
        var postData = {
          "grant_type": "password",
          "username": $scope.authorization.username,
          "password": $scope.authorization.password,
          "client_id": "infoarchive.iawa",
          "client_secret": "secret",
          "scope": "search compliance administration"
        };


        AuthService.login($scope.authorization.username,
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
              if (!tokens.error) tokens.error = "Error";
              if (!tokens.error_description) tokens.error_description = "Not Connected";
              $scope.authorization.error = true;
              $scope.authorization.statusText = tokens.error + ": " + tokens.error_description;;
            }
          });
      }
    };
  })

  .controller('AppsCtrl', function ($scope, $state, AuthService, LoadService, $ionicHistory, $ionicPopover) {

    $scope.add = function ($event, $index) {

      //console.log("Added " + $index);
      var appId = $scope.applications[$index].appId;

      LoadService.app(AuthService.getAccessToken(), appId, function (tokens) {

        console.log(tokens);
        if (tokens.formId != "" /*&& tokens.queryId*/) {

          LoadService.form(AuthService.getAccessToken(), tokens.formId /*,tokens.queryId*/, function (tokens) {
            //console.log('Forms');
            //console.log( tokens );
            $state.go('tab.search');
          });

        }
        else {
          //console.log ( "NO SEARCH") ;
          $scope.popover.show($event);

        }
      });
    };

    $ionicPopover.fromTemplateUrl('templates/pop-nosearch.html', {
      backdropClickToClose: true,
      scope: $scope
    })
      .then(function (popover) {
        $scope.popover = popover;
      });

    LoadService.load(AuthService.getAccessToken(), function (tokens) {

      //console.log('UserId is ' + tokens.userId);

      LoadService.apps(AuthService.getAccessToken(), tokens.userId, function (apps) {

        //console.log('Applications');
        var appCount = apps.length;
        $scope.applications = apps;
        //console.log($ionicHistory.currentStateName());
        tabState = "tab.apps";

      });
    });
  })

  .controller('SearchCtrl', function ($scope, $state, AuthService, LoadService, SearchService, x2js, $ionicPopup) {

    // An alert dialog
    $scope.showAlert = function () {
      var alertPopup = $ionicPopup.alert({
        title: 'No Results found',
        template: 'Expand your search criteria'
      });

      alertPopup.then(function (res) {
        console.log('No results');
      });
    };

    $scope.formData = LoadService.getFormData();

    $scope.search = function (form) {

      if (form.$valid && $scope.formData.length) {

        var preload = {
          "data": {
            "criterion": [],
            "order-by": {
              "name": $scope.formData[0].id,
              "direction": "ASCENDING"
            }
          }
        };

        angular.forEach($scope.formData, function (obj, key) {
          var criteria = {
            "name": obj.id,
            "operator": "EQUAL",
            "value": obj.value
          };
          preload.data.criterion.push(criteria);
        });

        var xml = new X2JS();
        var payload = xml.json2xml_str(preload);

        SearchService.search(AuthService.getAccessToken(),
          LoadService.getSearchId(),
          LoadService.getResultsId(),
          payload,
          function (tokens) {

            console.log('Results');
            console.log(tokens);
            if (tokens.rows > 0) {
              $state.go('tab.results');
            }
            else {
              $scope.showAlert();
            }
          });
      }
    };
  })

  .controller('ResultsCtrl', function ($scope, $state, SearchService, $ionicModal) {

    $scope.data = SearchService.getResults();
    $scope.data.sortOn = $scope.data.columns[0].id;
    $scope.data.sortReverse = false;
    $scope.side_item = {};

    $scope.sortBy = function (columnId) {
      console.log("sorting by column id " + columnId);
      $scope.data.sortOn = columnId;
      $scope.data.sortReverse = !$scope.data.sortReverse;
    };

    $ionicModal.fromTemplateUrl('templates/modal-sideresults.html', {
      animation: 'slide-in-up',
      scope: $scope
    })
      .then(function (modal) {
        $scope.modal = modal;
      });


    $scope.expand = function ($event, item) {
      console.log(item);
      $scope.side_item = item;
      $scope.modal.show($event);

    };

  })
  .controller('DashCtrl', function ($scope, $state) {
    console.log("Dashboard");
    tabState = "tab.dash";
  })

  .controller('CompCtrl', function ($scope, $state) {
    console.log("Compliance");
    tabState = "tab.comp";
  })





