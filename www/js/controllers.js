angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout,$http, Document) {
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };
  $scope.fbLogin = function() {
      openFB.login(
          function(response) {
              if (response.status === 'connected') {
                  console.log('Facebook login succeeded');
                  console.log(response);
                  // ON LOGIN : set my facebook identity to server
                  openFB.api({ // get api facebook
                    path: '/me',
                    params: {fields: 'id,name,birthday,gender,about,is_verified'},
                    success: function(user) { // set
                      // global app assign user
                        $scope.$apply(function() {
                            $scope.user = user;
                            //GLOBALS_VARS['user'] user;
                            var token = response.authResponse.token;
                                // insert or update item
                                Document.addUser(user.id,user.name,user.gender,token).then(function(documents){
                                    $scope.documents = documents;
                                    console.log("addUser");
                                    console.log(documents);
                                });
                            console.log ("userfb conected");
                            console.log(user);
                        });
                        /*
                        //SEND FIRST INFOS Conect infos TO SERVER && update sql
                        $http.post(GLOBAL_URL+'/user', {                            id:user.id,
                          name:user.name,
                          gender:user.gender
                        }).success(function(data, status, headers, config) {
                          console.log("ok SERVER");
                          // this callback will be called asynchronously
                          // when the response is available
                          //redirect to profil with update infos server
                        }).error(function(data, status, headers, config) {
                          console.log("problem avec SERVER NodeJS");
                          // called asynchronously if an error occurs
                          // or server returns response with an error status.
                        });
                        */
                    },
                    error: function(error) {
                        alert('Facebook error: ' + error.error_description);
                    }
                  });
                alert ("Vous etes connecte avec Facebook ! Veuillez noter que FB est la seule plateforme de conection ici (API-V2) !");
              } else {
                  alert('Facebook login failed');
              }
          },
          {scope: GLOBAL_SCOPE_FB});
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})
.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})
.controller('ProfileCtrl', function($scope, $http, Document) {
  
  $scope.updateSettings = function(toogle_woman,toogle_man,toogle_other,range_distance){
    $scope.toogle_woman = toogle_woman;
    $scope.toogle_man = toogle_man;
    $scope.toogle_other = toogle_other;
    $scope.range_distance = range_distance;
    var settings = {"toogle_woman":toogle_woman,"toogle_man":toogle_man,"toogle_other":toogle_other,"range_distance":range_distance};
    Document.getUser().then(function(documents){
      //console.log (documents);
      Document.updateSettings(documents.id_fb,JSON.stringify(settings));
    });
  };
  // on INIT, get settings
  Document.getUser().then(function(documents){
      var setting = JSON.parse(documents.settings);
      // si setting ok
      if (setting != null){
        $scope.toogle_woman = setting.toogle_woman;
        $scope.toogle_man = setting.toogle_man;
        $scope.toogle_other = setting.toogle_other;
        $scope.range_distance = setting.range_distance;
      } else {
        $scope.toogle_woman = true;
        $scope.toogle_woman = true;
        $scope.toogle_man = true;
        $scope.toogle_other = true;
        $scope.range_distance = 20;
      }
  });
  // on init request api with all infos
    openFB.api({
        path: '/me',
        params: {fields: ''},
        success: function(user) {
          console.log ("ccccc");
          console.log (user);
            // set view user
            $scope.$apply(function() {
                $scope.user = user;
            });
            // set to SERVER NODE news (if needed timing)
            //console.log (user);
            //SEND user infos TO SERVER
            
            $http.post(GLOBAL_URL+'/user', {
              objectFB:user
            }).success(function(data, status, headers, config) {
              console.log("ok send user info to SERVER");
              console.log (data);

              // insert or update item User
              Document.updateTokenServer(user.id, data.server_token);
            }).error(function(data, status, headers, config) {
              console.log("problem avec PROFIL SERVER NodeJS");
              // called asynchronously if an error occurs
              // or server returns response with an error status.
            });
        },
        error: function(error) {
            alert('Facebook error: ' + error.error_description);
        }
    });//fin recup && send fb to server
})
.controller('SearchCtrl', function($scope, $http, Document) {
  $scope.profilDetailsView = function (profile){
    console.log (profile);
  };
    // search geoloc for proximity
    navigator.geolocation.getCurrentPosition(function(location){
      console.log ("ok geoloc");
      console.log (location);

        // get user references
        Document.getUser().then(function(documents_user){
          var setting = JSON.parse(documents_user.settings);
          //update geolocation
          console.log (documents_user);
          Document.updateGeolocation(documents_user.id_fb, JSON.stringify(location)).then(function(documents){
              $scope.documents = documents;
              console.log("updategeolocation");
              console.log(documents);
          });
          // post to server news infos

          /* Send to SERVER my POSITION with my serverkey */
          $http.post(GLOBAL_URL+'/user/geolocation', {
            server_token:documents_user.server_token,
            geolocation:location
          }).success(function(data, status, headers, config) {
            console.log("ok send geolocation to SERVER");
            console.log (data);
            $scope.location = location;
          }).error(function(data, status, headers, config) {
            console.log("problem avec PROFIL SERVER NodeJS");
          });

          /* Get from SERVER list of user proximity */
          $http.post(GLOBAL_URL+'/proximity', {
            server_token:documents_user.server_token,
            geolocation:location,
            settings:setting
          }).success(function(data, status, headers, config) {
            console.log("ok get proximity to SERVER");
            console.log (data);
            $scope.profiles = data;
            $scope.location = location;
          }).error(function(data, status, headers, config) {
            console.log("problem avec proximity SERVER NodeJS");
          });
        });
      
    }, function(){
      console.log ("error GEOLOCALISATION !");
    });
})
.controller('UserDetailsCtrl', function($scope, $stateParams) {
  console.log ($scope);
})
.controller('PlaylistCtrl', function($scope, $stateParams) {
});
