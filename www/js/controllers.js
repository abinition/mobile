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


  .controller('ParentCtlr', function ($scope, $state, $rootScope,  $ionicSideMenuDelegate, AuthService, $ionicPopover, $ionicModal, $localStorage, $sessionStorage) {

    // Controls side out bar and tabs

    /*
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
    */
    
    $scope.$on("$ionicView.beforeEnter",function(event,data) {
      $scope.username = AuthService.getUsername();
      $scope.authority = AuthService.getAuthority();
    });

    $scope.$on("$ionicView.loaded",function(event,data) {
      $scope.settings = {
        "server": $localStorage.server,
        "port": $localStorage.port
      };
      $rootScope.serverURL =
          "http://" +
          $localStorage.server + ":" + $localStorage.port +
          "/";
    });
          
    $scope.$on("$ionicView.afterLeave",function(event,data) {
        $ionicSideMenuDelegate.toggleRight(0);
    });


    $ionicModal.fromTemplateUrl('templates/modal-settings.html', {
      animation: 'slide-in-up',
      scope: $scope
    })
      .then(function (modal) {
        $scope.modal = modal;
        $scope.closeModal = function ($event) { 
          $scope.modal.hide(); 
        }
      });

    $ionicPopover.fromTemplateUrl('templates/pop-about.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
        $scope.aboutPopover = popover;
        $scope.closeAboutPop = function ($event) { 
          $scope.aboutPopover.hide(); 
        }
    });

    $ionicPopover.fromTemplateUrl('templates/pop-signout.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
        $scope.signoutPopover = popover;
        $scope.closeSignoutPop = function ($event) { 
          $scope.signoutPopover.hide(); 
        }
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
      //console.log("cancelled");
      $scope.modal.hide();
    };

    $scope.openAboutPopover = function ($event) {
      $scope.version = $localStorage.version;
      $scope.aboutPopover.show($event);
    };

    $scope.openSignoutPopover = function ($event) {
      $ionicSideMenuDelegate.toggleRight(0);
      $state.go("auth.login", {}, {reload: true});
      $scope.signoutPopover.show($event);
    };

/*
  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });
  // Execute action on hidden popover
  $scope.$on('signoutPoover.hidden', function() {
    // Execute action
  });
  // Execute action on remove popover
  $scope.$on('popover.removed', function() {
    // Execute action
  });
  */

  })


  .controller('AuthCtrl', function ($scope, $state, $ionicSideMenuDelegate,$localStorage, $rootScope, AuthService) {

    $scope.$on("$ionicView.loaded",function(event,data) {
      
      if (typeof (Storage) != "undefined") {
        if (angular.isUndefined($localStorage.server))
          $localStorage.server = "localhost";
        if (angular.isUndefined($localStorage.port))
          $localStorage.port = "8080";
        if (angular.isUndefined($localStorage.version))
          $localStorage.version = "0.9-2";
        if (angular.isUndefined($localStorage.saved))
          $localStorage.saved =  "" ;
      }

      $scope.authorization = {
        username: '',
        password: '',
        language: 'en',
        statusText: 'Unknown error',
        error: false,
        access_token: '',
        server: $localStorage.server,
        port: $localStorage.port,
        saved:  $localStorage.saved
      };


    });

    $scope.$on("$ionicView.beforeEnter",function(event,data) {
        $ionicSideMenuDelegate.toggleRight(0);
        $scope.authorization.error = false ;
    });

    $scope.payload = function (obj) {
      var str = [];
      for (var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
    };

    $scope.signIn = function (form) {

      if (form.$valid) {

        //console.log("Authenticating");
        //console.log($scope.authorization);

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
              //console.log("Returned token is " + tokens.access_token);
              $scope.authorization.error = false;
              $scope.authorization.access_token = tokens.access_token;
              $localStorage.saved = $scope.authorization.username ;
              $state.go('tab.apps', {}, {reload: true});
            }
            else {
              if (!tokens.error) tokens.error = "Error";
              if (!tokens.error_description) tokens.error_description = "Not Connected";
              $scope.authorization.error = true;
              $scope.authorization.statusText = tokens.error + ": " + tokens.error_description;
              $scope.authorization.error = true ;
            }
          });
      }
    };
  })

  .controller('AppsCtrl', function ($scope, $state, AuthService, LoadService, $ionicPopover) {

    //console.log("Apps ctrl"); 

    $scope.add = function ($event, $index) {

      var appId = $scope.applications[$index].appId;

      LoadService.app(AuthService.getAccessToken(), appId, function (searches) {

        //console.log(searches);
        if ( searches.error_description ) {
          $scope.expiredPopover.show($event);
          $state.go("auth.login"); 
        }
        else {

          if (searches.length > 0) {

            //if (searches.length > 1) {
              $state.go('tab.searches', {}, {reload: true});
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
        $scope.closeAppPop = function ($event) { 
          $scope.popover2.hide(); 
        }
    });

    $ionicPopover.fromTemplateUrl('templates/pop-nosearch.html', {
      backdropClickToClose: true,
      scope: $scope
    }).then(function (popover) {
        $scope.popover = popover;
        $scope.closeNosearchPop = function ($event) { 
          $scope.popover.hide(); 
        }
    });
    
    $ionicPopover.fromTemplateUrl('templates/pop-expired.html', {
      backdropClickToClose: true,
      scope: $scope
    }).then(function (popover) {
        $scope.expiredPopover = popover;
        $scope.closeExpiredPop = function ($event) { 
          $scope.expiredPopover.hide(); 
        }
    });

    $scope.$on("$ionicView.beforeEnter",function(event,data) {
      LoadService.load(AuthService.getAccessToken(), function (tokens) {
        LoadService.apps(AuthService.getAccessToken(), tokens.userId, function (apps) {
          if ( apps.error_description )  {
            $state.go("auth.login");
            $scope.expiredPopover.show($event);
          }
          else {
            //console.log('Applications');
            $scope.appCount = apps.length;
            $scope.applications = apps;
            $scope.activeCount = 0 ;
            for ( i=0; i<$scope.appCount; i++ ) if ( apps[i].state == 'READY' || apps[i].state == 'ACTIVE' ) $scope.activeCount++ ;
          }
      });
      });
    });


    
  })

  .controller('SearchesCtrl', function ($scope, $state, LoadService, AuthService, $ionicPopover) {
    $scope.add = function ($event, $index) {

      var searchesId = $scope.searches[$index].searchesId;
      var queryId = $scope.searches[$index].queryId 
      LoadService.searches(AuthService.getAccessToken(), searchesId, queryId, function (tokens) {
          //console.log ( tokens ) ;
          LoadService.form(AuthService.getAccessToken(), tokens.formId, function (tokens) {
            if ( tokens.error_description )  {
              $scope.expiredPopover.show($event);  
              $state.go("auth.login"); 
            }
            else {
              $state.go('tab.search', {}, {reload: true});
            }
          });
      });
    };

    
    $scope.$on("$ionicView.beforeEnter",function(event,data) {
      $scope.searches = LoadService.getSearchData();
    });

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
        $scope.closeSearchPop = function ($event) { 
          $scope.popover.hide(); 
        }
        
    });
    $ionicPopover.fromTemplateUrl('templates/pop-expired.html', {
      backdropClickToClose: true,
      scope: $scope
    }).then(function (popover) {
        $scope.expiredPopover = popover;
        $scope.closeExpiredPop = function ($event) { 
          $scope.expiredPopover.hide(); 
        }
    });

  })
  .controller('SearchCtrl', function ($scope, $state, AuthService, LoadService, SearchService, x2js, $ionicPopup, $ionicPopover) {

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
    
    $ionicPopover.fromTemplateUrl('templates/pop-expired.html', {
      backdropClickToClose: true,
      scope: $scope
    }).then(function (popover) {
        $scope.expiredPopover = popover;
        $scope.closeExpiredPop = function ($event) { 
          $scope.expiredPopover.hide(); 
        }
    });

    $scope.$on("$ionicView.beforeEnter",function(event,data) {
      console.log("Fetching form data");
      $scope.formData = LoadService.getFormData();
      //console.log($scope.formData);
    });
    
    $scope.today = new Date();

    $scope.range = {
      dt: function(dateString) {
       return arguments.length ? (new Date(2000,1,1)) : new Date(2016,11,7); //Date.parse(dateString);
      }
    };

    $scope.search = function (form) {

      if (form.$valid && $scope.formData.length) {

        var appParms = LoadService.getAppParms();
        //console.log(appParms);
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

        //console.log(payload);

        SearchService.search(
          AuthService.getAccessToken(),
          LoadService.getSearchId(),
          LoadService.getResultId(),
          LoadService.getResultsId(),
          payload,
          function (tokens) {
            //console.log(tokens);
            if ( tokens.error_description ) {
              $scope.expiredPopover.show($event);
              $state.go("auth.login"); 
            } 
            else {
              if (tokens.rows > 0) {
                $state.go('tab.results', {}, {reload: true});
              }
              else {
                $scope.showAlert();
              }
            }
          });
      }
    };
  })

  .controller('ResultsCtrl', function ($scope, $state, SearchService, ResultsService /*, $ionicModal */) {


    $scope.$on("$ionicView.beforeEnter",function(event,data) {
      $scope.data = SearchService.getResults();
      //console.log ( $scope.data ) ;
      $scope.data.sortOn = $scope.data.columns[0].id;
      $scope.data.sortReverse = false;
      $scope.side_item = {};
    });

    $scope.sortBy = function (columnId) {
      //console.log("sorting by column id " + columnId);
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
      $state.go("tab.details", {}, {reload: true});

    };

  })

  .controller('DetailsCtrl', function ($scope, $state, AuthService, ResultsService, LoadService, $ionicPopover, $rootScope, $cordovaFileTransfer, $timeout ) {

    $scope.$on("$ionicView.beforeEnter",function(event,data) {
      $scope.item = ResultsService.getResults();
      //console.log( $scope.item ) ;
    });

    $ionicPopover.fromTemplateUrl('templates/pop-downloaded.html', {
      backdropClickToClose: true,
      scope: $scope
    })
    .then(function (popover) {
        $scope.popover = popover;
        $scope.closeDownloadedPop = function ($event) { 
          $scope.popover.hide(); 
        }
    });

    $scope.download = function ($event, $index) {

      var doCordovaFTmethod = ( mobileApp.globals.fs == null ) ;
      var fn = $scope.item["FileName"] ; 
      var cid = $scope.item["cid"] ; 
      var access_token = AuthService.getAccessToken() ;
      
      var url = $rootScope.serverURL + 'restapi/systemdata/applications/' + 
          LoadService.getAppId() +
          '/ci?cid=' + cid; 
      console.log ( url ) ;          
        
      // To support earlier versions of IA
      cid = cid.replace ( /:/g, '%3A') ;   

      if ( doCordovaFTmethod ) {

        console.log("Using cordova method");
        /*
        * This cordova method ( FileTransfer download ) seems not to like any place but
        * cordova.file.externalDataDirectory + fn ;
        * also know as 'cdvfile://localhost/files-external/' + fn
        */

        // Either of the two forms will work
        //var targetPath = cordova.file.externalDataDirectory + fn ;
        //var targetPath = 'cdvfile://localhost/sdcard/media/' + fn ;
        //console.log ( "Cordova externalDataDirectory: "+targetPath);
        // == file:///storage/eumlated/0/Android/data/com.ionicframework.mobile178225/files/file.mp3
        // == 'cdvfile://localhost/files-external/' + fn ;



        /****** Don't really need this, but it converts into cdvfile format ****
        window.resolveLocalFileSystemURL(
          targetPath, 
          function(entry) {
            targetPath = entry.toInternalURL() ;
            alert("->toInternalURL "+targetPath);
            // == cdvfile://localhost/files-external/file.mp3
          },
          function(err){
            alert(JSON.stringify(err, null, 4));
          }
        );
        ******/

        //targetPath = cordova.file.documentsDirectory + fn ;
        //  ... same as,see config.xml
        targetPath = 'cdvfile://localhost/documents/' + fn ; 
        
        var trustHosts = true;
        var options = {};
        var uri = encodeURI(url);

        mobileApp.globals.ft.download(
            uri,
            targetPath,
            function(entry) {
                console.log("download complete: " + entry.fullPath);
                $scope.downloadFile = "Saved file as " + entry.toURL() ;
                $scope.popover.show($event);
            },
            function(error) {
                console.log("download error source " + error.source);
                console.log("download error target " + error.target);
                console.log("upload error code" + error.code);
                $scope.downloadFile = "Failed to download " + error.target ;
                $scope.popover.show($event);
            },
            false,
            {
                headers: {
                  'Authorization': 'Bearer ' + access_token,  
                  'Accept': '*/*'                  
                }
            }
        );
      }
      else {
        LoadService.download(access_token, LoadService.getAppId(), cid, fn, function (tokens) {

          console.log("downloaded "+url) ;


          mobileApp.globals.fs.root.getDirectory(
            mobileApp.globals.dir,
            {
              create: true,
              exclusive: false
            },
            function(dirEntry) {
              dirEntry.getFile(
                tokens.name, 
                { 
                  create: true, 
                  exclusive: false 
                }, 
                function (fileEntry) {
                  console.log(fileEntry);
                  //console.log ( fileEntry.toURL() ) ;
                  $scope.downloadFile = "Saved file as " + fileEntry.fullPath ;
                  var isAppend = false ;
                  writeFile(fileEntry, tokens.data, isAppend  );
                  $scope.popover.show($event);
                }, onErrorCreateFile);
              }, onErrorCreateDir);
          
        });
      }
    }
  })

  .controller('DashCtrl', function ($scope, $state) {
    console.log("Dashboard");
  })

  .controller('CompCtrl', function ($scope, $state) {
    console.log("Compliance");
  }) ;

/*
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
          console.log('file system open: ' + dirEntry.name);
          $scope.downloadFile = dirEntry.name + tokens.name ;
          createFile(dirEntry, tokens.name, tokens.data);
          $scope.popover.show($event);
        }, onErrorResolveFS);
  */  

        /*
        mobileApp.globals.fs.root.getFile(tokens.name, { create: true, exclusive: false }, function (fileEntry) {

            console.log(fileEntry);
            // fileEntry.name == 'someFile.txt'
            // fileEntry.fullPath == '/someFile.txt';
            writeFile(fileEntry, tokens.data );
            $scope.downloadFile = fileEntry.fullPath ;
            $scope.popover.show($event);

        }, onErrorCreateFile);
        
        */