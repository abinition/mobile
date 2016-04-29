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

    .controller('NavController', function($scope, $ionicSideMenuDelegate) {
      $scope.toggleLeft = function() {
        $ionicSideMenuDelegate.toggleLeft();
      };
    })
    
    .controller('SndController', function($scope, $ionicSideMenuDelegate) {
    })
    
  .controller('AuthCtrl', function ($scope, $state, AuthService) {

    $scope.authorization = {
      username: '',
      password: '',
      language: 'en',
      statusText: '',
      error: false,
      token: ''
    };

    $scope.signIn = function (form) {

      if (form.$valid) {

        console.log("Authenticating");
        console.log($scope.authorization);
        AuthService.login($scope.authorization.username, $scope.authorization.password, function (tokens) {
          console.log('done');
          if (tokens.auth) {
            console.log("Returned token is " + tokens.auth);
            $scope.authorization.error = false;
            $scope.authorization.token = tokens.auth;
            $state.go('tab.dash');
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

  .controller('DashCtrl', function ($scope, $state, AuthService, LoadService) {
    console.log("HOME");
    LoadService.load(AuthService.getToken(), function (userId) {
      console.log('UserId is ' + userId);
      LoadService.apps(AuthService.getToken(), userId, function (tokens) {
        console.log('Applications');
        var appCount = tokens.length;
        console.log(tokens);
      });
    });
  })
  .controller('AppsCtrl', function ($scope, $state) {
    console.log("Apps");
  })
  .controller('CompCtrl', function ($scope, $state) {
    console.log("Compliance");
  });  
  
  
