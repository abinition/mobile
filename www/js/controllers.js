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


  .controller('SideCtlr', function ($scope, $state, $rootScope, AuthService, $ionicPopover, $ionicModal, $localStorage, $sessionStorage) {

    /*
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
    */
    $scope.username = AuthService.getUsername();
    $scope.authority = AuthService.getAuthority();
    $scope.username = AuthService.getUsername();
    $scope.settings = {
      "server": $localStorage.server,
      "port": $localStorage.port
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
        $localStorage.server = $scope.settings.server;
        $localStorage.port = $scope.settings.port;
        $rootScope.serverURL =
          "http://" +
          $localStorage.server + ":" + $localStorage.port +
          "/";
      }
      $scope.modal.hide();
    };

    $scope.cancelSettings = function () {
      console.log("cancelled");
      $scope.modal.hide();
    };

    $scope.openAboutPopover = function ($event) {
      $scope.version = $localStorage.version;
      $scope.aboutPopover.show($event);
    };

    $scope.openSignoutPopover = function ($event) {
      $scope.signoutPopover.show($event);
      $state.go("auth");
    };

  })

  .controller('TabCtlr', function ($scope, $ionicHistory) {
    //console.log($ionicHistory.currentStateName());
  })

  .controller('AuthCtrl', function ($scope, $state, $localStorage, $rootScope, AuthService) {

    $scope.authorization = {
      username: '',
      password: '',
      language: 'en',
      statusText: 'Unknown error',
      access_token: '',
      server: '',
      port: null
    };

    $scope.payload = function (obj) {
      var str = [];
      for (var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
    };

    $scope.signIn = function (form) {

      if (form.$valid) {

        console.log("Authenticating");
        console.log($scope.authorization);

        if (typeof (Storage) != "undefined") {

          if (angular.isUndefined($localStorage.server))
            $localStorage.server = "localhost";

          if (angular.isUndefined($localStorage.port))
            $localStorage.port = "8080";

          if (angular.isUndefined($localStorage.version))
            $localStorage.version = "0.9-1";
        }

        else {
          alert("LocalStorage not supported!");
        }


        if ($scope.authorization.server != "")
          $localStorage.server = $scope.authorization.server;
        if ($scope.authorization.port != null)
          $localStorage.port = $scope.authorization.port;

        $rootScope.serverURL =
          "http://" +
          $localStorage.server + ":" + $localStorage.port +
          "/";

        var postData = {
          "grant_type": "password",
          "username": $scope.authorization.username,
          "password": $scope.authorization.password,
          //"client_id": "infoarchive.iawa",
          //"client_secret": "secret",
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

  .controller('AppsCtrl', function ($scope, $state, AuthService, LoadService, $ionicPopover) {

    $scope.add = function ($event, $index) {

      var appId = $scope.applications[$index].appId;

      LoadService.app(AuthService.getAccessToken(), appId, function (searches) {

        console.log(searches);

        if (searches.length > 0) {

          //if (searches.length > 1) {
            $state.go('tab.searches');
          //}
          //else {
          //  LoadService.form(AuthService.getAccessToken(), searches[0].formId, function (tokens) {
          //    $state.go('tab.search');
          //  });
          //}
        }
        else {
          //console.log ( "NO SEARCH") ;
          $scope.popover.show($event);

        }
      });
    };

    $scope.info = function ($event, $index) {
      $scope.appInfo = $scope.applications[$index].description;
      $scope.appCategory = $scope.applications[$index].category;
      $scope.popover2.show($event);
    }

    $ionicPopover.fromTemplateUrl('templates/pop-appinfo.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
        $scope.popover2 = popover;
    });

    $ionicPopover.fromTemplateUrl('templates/pop-nosearch.html', {
      backdropClickToClose: true,
      scope: $scope
    }).then(function (popover) {
        $scope.popover = popover;
    });

    LoadService.load(AuthService.getAccessToken(), function (tokens) {

      LoadService.apps(AuthService.getAccessToken(), tokens.userId, function (apps) {
        //console.log('Applications');
        $scope.appCount = apps.length;
        $scope.applications = apps;
      });
    });
  })

  .controller('SearchesCtrl', function ($scope, $state, LoadService, AuthService, $ionicPopover) {
    $scope.add = function ($event, $index) {

      var searchesId = $scope.searches[$index].searchesId;
      var queryId = $scope.searches[$index].queryId 
      LoadService.searches(AuthService.getAccessToken(), searchesId, queryId, function (tokens) {
          console.log ( tokens ) ;
          LoadService.form(AuthService.getAccessToken(), tokens.formId, function (tokens) {
            $state.go('tab.search');
          });
      });
    };
    $scope.searches = LoadService.getSearchData();
    
    $scope.info = function ($event, $index) {
      $scope.description = $scope.searches[$index].description;
      $scope.name = $scope.searches[$index].name;
      $scope.popover.show($event);
    }

    $ionicPopover.fromTemplateUrl('templates/pop-searchinfo.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
        $scope.popover = popover;
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

        var appParms = LoadService.getAppParms();
        console.log(appParms);
        var preload = {};
        if (appParms.archiveType == 'SIP') {
          preload = {
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
        }
        else if (appParms.archiveType == 'TABLE') {
          preload.data = {};
          angular.forEach($scope.formData, function (obj, key) {
            preload.data[obj.id] = obj.value;
          });
        }
        var xml = new X2JS();
        var payload = xml.json2xml_str(preload);

        console.log(payload);

        SearchService.search(AuthService.getAccessToken(),
          LoadService.getSearchId(),
          LoadService.getResultId(),
          LoadService.getResultsId(),
          payload,
          function (tokens) {
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

  .controller('ResultsCtrl', function ($scope, $state, SearchService, ResultsService /*, $ionicModal */) {

    $scope.data = SearchService.getResults();
    $scope.data.sortOn = $scope.data.columns[0].id;
    $scope.data.sortReverse = false;
    $scope.side_item = {};

    $scope.sortBy = function (columnId) {
      console.log("sorting by column id " + columnId);
      $scope.data.sortOn = columnId;
      $scope.data.sortReverse = !$scope.data.sortReverse;
    };

    /*
    $ionicModal.fromTemplateUrl('templates/modal-sideresults.html', {
      animation: 'slide-in-up',
      scope: $scope
    })
      .then(function (modal) {
        $scope.modal = modal;
      });
    */

    $scope.expand = function ($event, item) {
      $scope.side_item = item;
      //$scope.modal.show($event);
      ResultsService.setResults(item);
      $state.go("tab.details");

    };

  })

  .controller('DetailsCtrl', function ($scope, $state, AuthService, ResultsService, LoadService, $rootScope, $cordovaFileTransfer ) {

    $scope.item = ResultsService.getResults();
    $scope.download = function ($event, $index) {
      console.log (  $scope.item["cid"] ) ;
      
      
      var fn = $scope.item["FileName"] ; 
      var cid = $scope.item["cid"] ; 
      cid = cid.replace ( /:/g, '%3A') ;
      
      
      //LoadService.download(AuthService.getAccessToken(), LoadService.getAppId(), cid, function (tokens) {
      //    console.log ( "downloaded" ) ;
      //});
      var url = $rootScope.serverURL + 'restapi/systemdata/applications/' + 
          LoadService.getAppId() +
          '/ci?cid=' + cid; 
          console.log ( cordova ) ;
      var targetPath = cordova.file.externalDataDirectory  + fn;
      var trustHosts = true;
      var options = {};

      $cordovaFileTransfer.download(url, targetPath, options, trustHosts)
      .then(function(result) {
        // Success!
      }, function(err) {
        // Error
      }, function (progress) {
        $timeout(function () {
          $scope.downloadProgress = (progress.loaded / progress.total) * 100;
        });
      });
    };

  })

  .controller('DashCtrl', function ($scope, $state) {
    console.log("Dashboard");
  })

  .controller('CompCtrl', function ($scope, $state) {
    console.log("Compliance");
  })





