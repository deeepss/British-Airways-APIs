var BaApp = angular.module('ba-app', ['ngMaterial', 'ngMessages', 'ngMap', 'ngCalander']);

BaApp.controller('HomeController', function($scope, $rootScope, $mdDialog, $mdMedia, LuftahnsaFactory){
    
    registerForPushNotifications();
    
    $rootScope.countriesList = [];
    
    $rootScope.airportsList = [];
    
    $rootScope.filteredFlightsList = [];
	
	$rootScope.luftahnsaReady = false;
	
	LuftahnsaFactory.getOauthToken( function() {
		$rootScope.luftahnsaReady = true;
	});
	
	
	$rootScope.allParsedAirports = function loadAll() {
      return Object.keys($rootScope.airportsList).map( function (state) {
      var searchVal = '';
      var displayVal = '';
          if ($rootScope.airportsList[state].City != undefined) {
             searchVal = $rootScope.airportsList[state].City.toLowerCase()+$rootScope.airportsList[state].AirportName.toLowerCase()+ $rootScope.airportsList[state].AirportCode.toLowerCase();
             displayVal = $rootScope.airportsList[state].City+', '+ $rootScope.airportsList[state].AirportName + ' ('+ $rootScope.airportsList[state].AirportCode + ")";
          } else {
            searchVal = $rootScope.airportsList[state].AirportName.toLowerCase()+ $rootScope.airportsList[state].AirportCode.toLowerCase();
            displayVal = $rootScope.airportsList[state].AirportName + ' ('+ $rootScope.airportsList[state].AirportCode + ")";
          }
        return {
          value: searchVal,
          display: displayVal,
          id :  $rootScope.airportsList[state]
        };
      });
    }
	
	$scope.showFlightsList = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
          locals: { 
              parentScope : $scope
          }, 
          controller: ResultsController,
          templateUrl: 'templates/results-template.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose:true,
          fullscreen: useFullScreen
        })
        .then(function(event) {
          
        }, function() {
          
        });
        
        $scope.$watch(function() {
          return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
          $scope.customFullscreen = (wantsFullScreen === true);
        });
    }
    
    function ResultsController($scope, $mdDialog, parentScope) {
        var pScope = parentScope;
        
        $scope.allAvailableFlights = pScope.filteredFlightsList;
        $scope.filteredFlightsList = $scope.allAvailableFlights;
        
        console.log( $scope.allAvailableFlights);
        
        $scope.hasHops = function (sector) {
            return (sector instanceof Array);
        }
        
        $scope.filter = {
            noStops : false
        };
            
        $scope.directFlightsOnly = function () {
            if (!$scope.filter.noStops) {
                var flights = [];
                angular.forEach($scope.allAvailableFlights , function(flight, key) {
                    console.log(flight);
                        if(!flight.Sector instanceof Array) {
                            this.push(flightInfo);
                        }
                     }, flights);
               $scope.filteredFlightsList = flights;
            } else {
               $scope.filteredFlightsList = $scope.allAvailableFlights;
               console.log( $scope.filteredFlightsList);
            }
        };
    }
    
     $scope.doPrimaryAction = function(event) {
        $mdDialog.show(
          $mdDialog.alert()
            .title('Primary Action')
            .textContent('Primary actions can be used for one click actions')
            .ariaLabel('Primary click demo')
            .ok('Awesome!')
            .targetEvent(event)
        );
    };
      
    $scope.doSecondaryAction = function(event) {
        console.log(event);
        $mdDialog.show(
          $mdDialog.alert()
            .title('Secondary Action')
            .textContent('Secondary actions can be used for one click actions')
            .ariaLabel('Secondary click demo')
            .ok('Neat!')
            .targetEvent(event)
        );
      };
    

    $scope.userLogin = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
          controller: DialogController,
          templateUrl: 'templates/login-template.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose:true,
          fullscreen: useFullScreen
        })
        .then(function(answer) {
          
        }, function() {
          
        });
        $scope.$watch(function() {
          return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
          $scope.customFullscreen = (wantsFullScreen === true);
        });
    };
    
    $scope.showProgessBar = function(ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
        $mdDialog.show({
          locals: { 
              params: $scope.responseReceived
          }, 
          controller: DialogController,
          templateUrl: 'templates/loading.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          fullscreen: useFullScreen
        })
        .then(function(answer) {
          
        }, function() {
          
        });
        $scope.$watch(function() {
          return $mdMedia('xs') || $mdMedia('sm');
        }, function(wantsFullScreen) {
          $scope.customFullscreen = (wantsFullScreen === true);
        });
    }
    
    $scope.hideProgessBar = function() {
        console.log("dialog cancelling");
        $mdDialog.hide();
    }
    
    function DialogController($scope, $mdDialog) { 
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };
      $scope.answer = function(answer) {
        $mdDialog.hide(answer);
      };
    }
    
    function registerForPushNotifications() {
        Pusher.log = function(message) {
          if (window.console && window.console.log) {
           // window.console.log(message);
          }
        };

        var pusher = new Pusher('36035f6737ab21579393', {
          encrypted: true
        });

        var channel = pusher.subscribe('offers');
        channel.bind('new-offer', function(data) {
            var message = "Save " + data.discount + " from " + data.from + " to "+ data.to + ". You can avail this offer only for next " + data.validity + "minutes. Hurry up..!";
            var confirm = $mdDialog.confirm()
                .title("New offer")
                .textContent(message)
                .ok('Book now')
                .cancel('No thanks!')
                .targetEvent(event);

            $mdDialog.show(confirm).then(function() {
                $scope.status = 'You decided to get rid of your debt.';
            }, function() {
                $scope.status = 'You decided to keep your debt.';
            });
        });
    }
});




