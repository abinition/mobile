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

  .controller('NavCtlr', function ($scope, $ionicSideMenuDelegate) {
    $scope.toggleLeft = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
  })

  .controller('AuthCtrl', function ($scope, $state, AuthService) {
    
    $scope.authorization = {
      username: '',
      password: '',
      language: 'en',
      statusText: 'Unknown error',
      authToken: ''
    };

    $scope.signIn = function (form) {
      if (form.$valid) {

        console.log("Authenticating");
        console.log($scope.authorization);
        AuthService.login($scope.authorization.username, $scope.authorization.password, function (tokens) {
          console.log('done');
          if (tokens.authToken) {
            console.log("Returned token is " + tokens.authToken);
            $scope.authorization.error = false;
            $scope.authorization.authToken = tokens.authToken;
            $state.go('tab.apps');
          }
          else {
            console.log(tokens.status + ' : ' + tokens.statusText);
            $scope.authorization.error = true;
            $scope.authorization.statusText = tokens.statusText;
          }
        });
      }
    };
  })

  .controller('AppsCtrl', function ($scope, $state, AuthService, LoadService) {

    $scope.add = function (index) {
      console.log("Added " + index);
      var appId = $scope.applications[index].appId;
      LoadService.app(AuthService.getAuthToken(), appId, function (searchId) {
        console.log('SearchId is ' + searchId);
        LoadService.form(AuthService.getAuthToken(), searchId, function (form) {
          console.log('Forms');
          console.log(form);

        });
      });
    };

    LoadService.load(AuthService.getAuthToken(), function (userId) {
      console.log('UserId is ' + userId);
      LoadService.apps(AuthService.getAuthToken(), userId, function (apps) {
        console.log('Applications');
        var appCount = apps.length;
        $scope.applications = apps;
      });
    });
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


