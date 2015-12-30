BaApp.controller('FlightsController', function($scope, $rootScope, $mdDialog, BritishAirways){
   
	BritishAirways.getListedLocations(function sucess(reponsse) {
        $rootScope.countriesList = reponsse.data.GetBA_LocationsResponse.Country;
        $scope.retriveAirportsInformation();
    }, function failed(error) {
        if (error.status == 404)
            console.log("No flights available");
    });
    
    $scope.retriveAirportsInformation = function() {
        var airports = [];
        angular.forEach($rootScope.countriesList, function(country, key) {
            if (country.City instanceof Array) {
                angular.forEach(country.City, function(city, key) {
                    if (city.Airport != undefined)
                        if (city.Airport instanceof Array) {
                             angular.forEach(city.Airport, function(airport, key) {
								airport.City = city.CityName;
                                this.push(airport);
                             }, airports);
                        } else {
                            this.push(city.Airport);
                        }
                }, airports);
            } else {
                this.push(country.City.Airport);
            }
        }, airports);
        $rootScope.airportsList = airports;
		$scope.airportsArray = $rootScope.allParsedAirports;
    }
	
	$rootScope.showNoFlights = function() {
		var message = "No flights available for the requested route.";
		var confirm = $mdDialog.confirm()
			.title("No flights")
			.textContent(message)
			.ok('Try different!')
			.targetEvent(event);

		$mdDialog.show(confirm).then(function() {
			$scope.status = 'You decided to get rid of your debt.';
		}, function() {
			$scope.status = 'You decided to keep your debt.';
		});
	}
	
	
	$rootScope.getFlightsInformation = function () {
		
	}
});

