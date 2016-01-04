BaApp.controller('QuickbookController', function($scope, $filter, $rootScope, BritishAirways, LuftahnsaFactory, WeatherServices, NgMap) {
    
	$scope.mapHolder = 0;
	
	$scope.airportsArray = [];
	$scope.$watchCollection('airportsList', function(current, old) {
       $scope.airportsArray = loadAll();
    });
	
    $scope.allDestinationFlights = [];
  
	$scope.selectedAirport = {};
	
	$scope.allDestinations = [];
	
	$scope.myLocationInfo = {
		pos : [51.47, 0.46], // LHR - Airport
		nearestAirport : [],
		airportsNearby : [],
		destinations : []
	}
	
	NgMap.getMap().then(function(map) {
		$scope.mapHolder = map;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition($scope.showHomeInMap, $scope.showError);
		} else {
			console.log("Geolocation is not supported by this browser.");
		}
	});
	
	$scope.showHomeInMap = function(position) {
		$scope.myLocationInfo.pos[0] = position.coords.latitude;
		$scope.myLocationInfo.pos[1] = position.coords.longitude;
		
		var gps = new google.maps.LatLng($scope.myLocationInfo.pos[0], $scope.myLocationInfo.pos[1]);
		var marker = new google.maps.Marker({ title: "You are here"});
		marker.setPosition(gps);
		marker.setMap($scope.mapHolder);
		marker.setIcon("img/icons/home-map-marker.png");
		$scope.mapHolder.setCenter(gps);
        
        
        
        clearAllFlightPath();
        $scope.requestInfo = {
                    locationCode: 'BLR',
                    startTime: '00:00', 
                    endTime : '23:59',
                    mode : 'D'
                }
        BritishAirways.searchFlightsByTime($scope.requestInfo, function sucess(result) {
            $scope.allDestinationFlights = [];
            if (result.data.FlightsResponse.Flight instanceof Array)
                $scope.allDestinationFlights = result.data.FlightsResponse.Flight;
            else 
                $scope.allDestinationFlights.push(result.data.FlightsResponse.Flight); 

            parseFlightInformation();
        }, function error(response) {
            $scope.allDestinationFlights = [];
            if (response.status == 404) {
                console.log("Flights are not availble from this location.");
            }
        });
	}

	$scope.allDestinations = [];
	$scope.addToDestination = function (destinationAirport, dflightInfo) {
		var flightAdded = false;
		for(var i = 0; i < $scope.allDestinations.length; i++) {
			var keyDestination = $scope.allDestinations[i];
			if(keyDestination.airport.display === destinationAirport.display) {
				$scope.allDestinations[i].flights.push(dflightInfo);
				flightAdded = true;
				break;
			}
		}
		
		if (!flightAdded) {
			var destination = {
				pos : [destinationAirport.id.Position.Latitude, destinationAirport.id.Position.Longitude],
				airport : destinationAirport,
				flights : []
			};
			
			destination.flights.push(dflightInfo);
			$scope.allDestinations.push(destination);	
			
			addNewPathToMap(destinationAirport);
		}
	}
	
	function addNewPathToMap(destinationAirport) {
		var to = [destinationAirport.id.Position.Latitude, destinationAirport.id.Position.Longitude];
		var from = [$scope.selectedAirport.Position.Latitude, $scope.selectedAirport.Position.Longitude];
		drawPath(from, to);
	}
	
	$scope.markerInfo = {};
	
	$scope.showDetails = function(e, position) {
	var destination = $scope.allDestinations[position];
		$scope.markerInfo.title = destination.airport.display;
		$scope.markerInfo.tag = position;
		$scope.markerInfo.flights = parsedFlightInformation(destination.flights);
		$scope.mapHolder.showInfoWindow('marker-info', this);
	 };
	
	$scope.getFlightInfo = function(id) {
		$scope.mapHolder.hideInfoWindow('marker-info');
		
		console.log($scope.allDestinations[$scope.markerInfo.tag].flights[id]);
	}
	
	function parsedFlightInformation(flights) {
		var parsedFlights = [];
		for(var i = 0; i < flights.length; i++) {
			var flightInfomation = {};
			flightInfomation.arrStatus = flights[i].ArrivalStatus;
			flightInfomation.aTerminal = flights[i].ArrivalTerminal;
			flightInfomation.arrDate = $filter('date')(flights[i].ReportedArrivalDateTime, "dd-MM-yyyy");
			flightInfomation.arrTime = $filter('date')(flights[i].ReportedArrivalDateTime, "hh:mm 'hrs'");
			parsedFlights.push(flightInfomation);
		}
		return parsedFlights;
	}
	
	function getNearestAirportUsingLufthansa(position) {
		var locationInfo =  position.coords.latitude +','+ position.coords.longitude;
		LuftahnsaFactory.getNearestAirports(locationInfo, function sucess(response) {
			$scope.myLocationInfo.airportsNearby = response.NearestAirportResource.Airports.Airport;
			var temp = [];
			angular.forEach($scope.myLocationInfo.airportsNearby, function(airport, key) {
				var location = [airport.Position.Coordinate.Latitude, airport.Position.Coordinate.Longitude];
				addMarkerInMap(location, "airport");   
			},temp);
		}, function error(err) {
			console.log(err);
		});
	}
	
	
	
    function addMarkerInMap(location, mode) {
		/*WeatherServices.getWeatherCondition(location[0], location[1], "LHR" ,function sucess(weatherInfo) {
			var gps = new google.maps.LatLng(weatherInfo.coords[0], weatherInfo.coords[1]);
			var marker = new google.maps.Marker({ title: weatherInfo.weather});
			marker.setPosition(gps);
			marker.setMap($scope.mapHolder);
			var iconUrl = "img/weather/" + weatherInfo.icon  + ".png";
			console.log(iconUrl);
			
			marker.setIcon(iconUrl);
			$scope.mapHolder.setCenter(gps);
		});*/
    }

	$scope.flightPaths = [];
	
	function drawPath(from, to) {
		  var flightPlanCoordinates = [{
			  lat: from[0], lng: from[1]
		  }, {
			  lat: to[0], lng: to[1]
		  }];
		
		  var flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: true,
			strokeColor: getRandomColor(),
			strokeOpacity: 1.0,
			strokeWeight: 2
		  });
		
		$scope.flightPaths.push(flightPath);
		
		$scope.flightPaths[$scope.flightPaths.length-1].setMap($scope.mapHolder);
	}
	
	function clearAllFlightPath() {
		for (i = 0 ; i < $scope.flightPaths.length; i++) {
			$scope.flightPaths[i].setMap(null);
		}
	}
	
	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
	
    $scope.dSelectedItemChange = function(item) {
			if (item === undefined) {
				return;
			} else {
				$scope.selectedAirport = item.id;
				$scope.allDestinations = [];
				clearAllFlightPath();
				$scope.requestInfo = {
							locationCode: item.id.AirportCode,
							startTime: '00:00', 
							endTime : '23:59',
							mode : 'D'
						}
				BritishAirways.searchFlightsByTime($scope.requestInfo, function sucess(result) {
					$scope.allDestinationFlights = [];
					if (result.data.FlightsResponse.Flight instanceof Array)
						$scope.allDestinationFlights = result.data.FlightsResponse.Flight;
					else 
						$scope.allDestinationFlights.push(result.data.FlightsResponse.Flight); 
					
					parseFlightInformation();
				}, function error(response) {
					$scope.allDestinationFlights = [];
					if (response.status == 404) {
						console.log("Flights are not availble for the requested route.");
					}
				});
			}
    }
	
	$scope.parsedFlightList = [];
	function parseFlightInformation() {
		$scope.parsedFlightList = [];
		angular.forEach($scope.allDestinationFlights, function(flight, key) {
			var parsedFlight = {
				sectors : []
			};
			parsedFlight.flightNumber = flight.FlightNumber; 
			
			if (flight.Sector instanceof Array) {
				for(var i = 0; i < flight.Sector.length; i++) {
					parsedFlight.sectors[i] = getFlightInformation(flight.Sector[i]);
				} 
			} else 
				parsedFlight.sectors[0] = getFlightInformation(flight.Sector);
			
			$scope.parsedFlightList.push(parsedFlight);
		}, $scope.parsedFlightList);
	}
	
	function getFlightInformation(sector) {
		var parsedSector = {};
		parsedSector.aAirportCode = sector.ArrivalAirport;
		parsedSector.arrStatus = sector.ArrivalStatus;
		parsedSector.aTerminal = sector.ArrivalTerminal;
		parsedSector.dAirportCode = sector.DepartureAirport;
		parsedSector.depStatus = sector.DepartureStatus;
		
		parsedSector.arrDate = $filter('date')(sector.ScheduledArrivalDateTime, "dd MMM yyyy");
		parsedSector.arrTime = $filter('date')(sector.ScheduledArrivalDateTime, "hh:mm 'hrs'");
		
		parsedSector.depDate = $filter('date')(sector.ScheduledDepartureDateTime, "dd MMM yyyy");
		parsedSector.depTime = $filter('date')(sector.ScheduledDepartureDateTime, "hh:mm 'hrs'");
		
		if (sector.DepartureAirport == $scope.selectedAirport.AirportCode) {
			$scope.addToDestination(querySearch(sector.ArrivalAirport)[0], sector);
		}
		return parsedSector;
	}
	
	$scope.simulateQuery = false;
	$scope.querySearch   = querySearch;
	
    function querySearch (query) {
      var results = query ?  $scope.airportsArray.filter( createFilterFor(query) ) :  $scope.airportsArray,
          deferred;
      if ($scope.simulateQuery) {
        deferred = $q.defer();
        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
        return deferred.promise;
      } else {
        return results;
      }
    }
	
    function loadAll() {
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
    
   
    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) >= 0);
      };
    }
	
		$scope.showError = function (error) {
		switch (error.code) {
			case error.PERMISSION_DENIED:
				$scope.error = "User denied the request for Geolocation."
				break;
			case error.POSITION_UNAVAILABLE:
				$scope.error = "Location information is unavailable."
				break;
			case error.TIMEOUT:
				$scope.error = "The request to get user location timed out."
				break;
			case error.UNKNOWN_ERROR:
				$scope.error = "An unknown error occurred."
				break;
		}
	}
	
});
