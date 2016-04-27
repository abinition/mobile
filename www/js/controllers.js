mobileApp

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
            $state.go('home');
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

  .controller('HomeCtrl', function ($scope, $state, AuthService, LoadService) {
    console.log("HOME");
    LoadService.load(AuthService.getToken(), function (appId) {
      console.log('AppId is '+appId);

      LoadService.apps(AuthService.getToken(), appId, function (tokens) {
        console.log('Applications');
        console.log(tokens);

      });
    });
  });
