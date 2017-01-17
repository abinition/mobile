var mobileApp = angular.module('starter', ['ionic','ionic.cloud', 'ngResource', 'ngStorage', 'ngCordova', 'base64','cb.x2js']);

mobileApp
  .config(function ($stateProvider, $urlRouterProvider,$provide, $ionicCloudProvider,$ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom');  
    $ionicConfigProvider.backButton.text('');
    $ionicConfigProvider.backButton.previousTitleText('');
        $ionicConfigProvider.backButton.icon('ion-arrow-left-b');
    $ionicCloudProvider.init({
    "core": {
      "app_id": "ca24bbb2"
    }
    });

    /*
    $provide.decorator('$rootScope', function ($delegate) {
      var _emit = $delegate.$emit;
      $delegate.$emit = function () {
         console.log.apply(console, arguments);
        _emit.apply(this, arguments);
      };

      return $delegate;
    });
    */
    
    $stateProvider

      //setup an abstract state for the tabs directive
      .state('auth', {
        url: '/auth',
        abstract: true,
        templateUrl: 'templates/auth.html',
        controller: 'ParentCtlr'
      })
      .state('auth.login', {
        url: '/login',
        views: {
          'viewContent':  {
            templateUrl: 'templates/auth.login.html',
            controller: 'AuthCtrl'
          }
        }
      })
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'ParentCtlr'
      })
      .state('tab.dash', {
        url: '/dash',
        views: {
          'tab-dash': {
            templateUrl: 'templates/tab-dash.html',
            controller: 'DashCtrl'
          }
        }
      })
      .state('tab.apps', {
        url: '/apps',
        views: {
          'tab-apps': {
            templateUrl: 'templates/tab-apps.html',
            controller: 'AppsCtrl'
          }
        }
      })
   
      .state('tab.search', {
        url: '/search',
        views: {
          'tab-apps': {
            templateUrl: 'templates/tab-search.html',
            controller: 'SearchCtrl'
          }
        }
      })
         
      .state('tab.searches', {
        url: '/searches',
        views: {
          'tab-apps': {
            templateUrl: 'templates/tab-searches.html',
            controller: 'SearchesCtrl'
          }
        }
      })
      .state('tab.results', {
        url: '/results',
        views: {
          'tab-apps': {
            templateUrl: 'templates/tab-results.html',
            controller: 'ResultsCtrl'
          }
        }
      })
      .state('tab.details', {
        url: '/details',
        views: {
          'tab-apps': {
            templateUrl: 'templates/tab-details.html',
            controller: 'DetailsCtrl'
          }
        }
      })
      .state('tab.comp', {
        url: '/comp',
        views: {
          'tab-comp': {
            templateUrl: 'templates/tab-comp.html',
            controller: 'CompCtrl'
          }
        }  
      })
      
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/auth/login');
  })
  .run(function ($ionicPlatform,$cordovaFileTransfer,$cordovaFile) {
    $ionicPlatform.ready(function () {
      //alert("Ready");
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      mobileApp.globals.dir = $ionicPlatform.is('ios') ? 'Downloads' : 'Download' ;

      if ( typeof cordova != 'undefined' ) {

        if ( File ) {
          mobileApp.globals.f = new File() ;
          //console.log(JSON.stringify(mobileApp.globals.f));
        }
        if ( FileTransfer ) {
          mobileApp.globals.ft = new FileTransfer() ;
          //console.log(JSON.stringify(mobileApp.globals.ft));
        }
      }
 
      var grantedBytes = 00*1024*1024 ;
      window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;  
      
      var storageRequest =  window.webkitStorageInfo || navigator.webkitPersistentStorage ;
      if ( storageRequest ) {
        console.log ( "Requesting quota");
        storageRequest.requestQuota(
          grantedBytes, 
          function (grantedBytes) {  
            console.log("granted,requesting file system");
            window.requestFileSystem( 1 /*LocalFileSystem.PERSISTENT*/, 
                                      grantedBytes, 
                                      onFileSystemSuccess, 
                                      errorHandler);
          }, 
          function (err) {
            console.log(JSON.stringify(err, null, 4));
          });
      }
      else {
        console.log("requesting file system");
        window.requestFileSystem( 1 /*LocalFileSystem.PERSISTENT*/, 
                                  grantedBytes, 
                                  onFileSystemSuccess, 
                                  errorHandler);
      }
    });
  })
  .globals = {
    "dir" : null,
    "f" : null,
    "fs" : null,
    "ft" : null
  };

/* CROME API */
function onFileSystemSuccess(fileSystem) {
  mobileApp.globals.fs = fileSystem ;  
  console.log('Opened file system: ' + fileSystem.name + '(' + fileSystem.fullPath + ')' );

}
var errorHandler = function (fileName, e) {  
    var msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'Storage quota exceeded';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'File not found';
            break;
        case FileError.SECURITY_ERR:
            msg = 'Security error';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'Invalid modification';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'Invalid state';
            break;
        default:
            msg = 'Unknown error';
            break;
    };

    alert('Error (' + fileName + '): ' + msg);
}

function createFile(dirEntry, fileName, dataObj) {
    // Creates a new file or returns the file if it already exists.
    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
        writeFile(fileEntry, dataObj);
    }, onErrorCreateFile);

}
 
function writeFile(fileEntry, dataObj, isAppend) {
    fileEntry.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function() {
            console.log("Successful file write...");
            readFile(fileEntry);
        };
        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
        };
        // If we are appending data to file, go to the end of the file.
        if (isAppend) {
            try {
                fileWriter.seek(fileWriter.length);
            }
            catch (e) {
                console.log("file doesn't exist!");
            }
        }
        fileWriter.write(dataObj);
    });
}

function readFile(fileEntry) {
    fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function() {
            //console.log("Successful file read: " + this.result);
            //displayFileData(fileEntry.fullPath + ": " + this.result);
        };
        reader.readAsText(file);
    }, onErrorReadFile);
}

function saveFile(dirEntry, fileData, fileName) {
    dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
        writeFile(fileEntry, fileData);
    }, onErrorCreateFile);
}

function onErrorResolveFS(evt) {
  console.log(evt);
} 

function onErrorCreateFile(evt) {
  console.log(evt);
}

function onErrorCreateDir(evt) {
  console.log(evt);
}

function onErrorReadFile(evt) {
  console.log(evt);
} 