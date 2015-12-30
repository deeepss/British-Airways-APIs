BaApp.controller('QuickbookController', function($scope, $filter, $rootScope, BritishAirways, LuftahnsaFactory, LocationServices, NgMap){
    $scope.departure = '';
	$scope.arrival = '';
    
	$scope.airportsArray = [];
	$scope.$watchCollection('airportsList', function(current, old) {
       $scope.airportsArray = loadAll();
    });
	
    $scope.filteredAirportList = [];
    
    $scope.flightList = [];
    
    $scope.simulateQuery = false;
    
    $scope.mode = 'D';
    $scope.querySearch   = querySearch;
    $scope.dSelectedItemChange = dSelectedItemChange;
    $scope.dSearchTextChange   = dSearchTextChange;
	
	$scope.selectedAirport = {};
	
	$scope.defaultRadius = 35000;
	
	$scope.mapHolder = 0;
	
	$scope.myLocationInfo = {
		pos : [51.47, 0.46], // LHR - Airport
		nearestAirport : [],
		airportsNearby : [],
		destinations : []
	}
	
	$scope.allLocations = [];
	
	NgMap.getMap().then(function(map) {
		$scope.mapHolder = map;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition($scope.showMyLocation, $scope.showError);
		} else {
			console.log("Geolocation is not supported by this browser.");
		}
	});
	
	$scope.showMyLocation = function (position) {
		$scope.myLocationInfo.pos[0] = position.coords.latitude;
		$scope.myLocationInfo.pos[1] = position.coords.longitude;
		showInMap($scope.myLocationInfo.pos, "home");
		
		// getNearestAirport();
		
		// getNearestAirportUsingLufthansa();
		
		
		function getNearestAirportUsingLufthansa() {
			var locationInfo =  position.coords.latitude +','+ position.coords.longitude;
			LuftahnsaFactory.getNearestAirports(locationInfo, function sucess(response) {
				$scope.myLocationInfo.airportsNearby = response.NearestAirportResource.Airports.Airport;
				console.log($scope.myLocationInfo.airportsNearby);
				
				var temp = [];
				angular.forEach($scope.myLocationInfo.airportsNearby, function(airport, key) {
					console.log(airport);
					var location = [airport.Position.Coordinate.Latitude, airport.Position.Coordinate.Longitude];
					showInMap(location, "airport");   
				},temp);
			}, function error(err) {
				console.log(err);
			});
		}
		
		function parseAirportInformation() {
			
		}
		
		function getNearestAirport() {
			LocationServices.getNearestAirport($scope.myLocationInfo.pos, 
											   $scope.defaultRadius, 
											   function sucess(response) {
				if(response.data.status == "OK")  {
						$scope.myLocationInfo.nearestAirport[0] = response.data.results[0].geometry.location.lat;
						$scope.myLocationInfo.nearestAirport[1] = response.data.results[0].geometry.location.lng;
						showInMap($scope.myLocationInfo.nearestAirport, "airport");    
				} else if(response.data.status == "ZERO_RESULTS") {
					$scope.defaultRadius = $scope.defaultRadius * 2;
					getNearestAirport();
				} else {
					console.log(response.data);
				}
			}, function error(err) {
				console.log(err);
			});
		}
	}
	
    function showInMap(location, mode) {
		console.log("plotting " + location);
		var gps = new google.maps.LatLng(location[0], location[1]);
        var marker = new google.maps.Marker({ title: "Marker: "});
		marker.setPosition(gps);
		marker.setMap($scope.mapHolder);
        if (mode == "sector")
            marker.setIcon("images/flight-icons/airport-marker.png");
		
		$scope.mapHolder.setCenter(gps);
    }
    
	function addLocationTolist(lat, longt, mode) {
		var element = {pos : []};
		element.pos[0] = lat; 
		element.pos[1] = longt; 
		
		$scope.allLocations.push(element);	
		showInMap(element.pos, mode);
	}
	
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
    
    function dSearchTextChange(text) {
        $scope.departure = '';
    }
	
	function addToDestination(airport) {
		var position = {};
		position[0] = airport.Position.Latitude;
		position[1] = airport.Position.Longitude;
		
		showInMap(position, 'airport');
		
		var sPos = [];
		sPos[0] = $scope.selectedAirport.Position.Latitude;
		sPos[1] = $scope.selectedAirport.Position.Longitude;
		
		drawPath(sPos, position);
	}
	
	
    function dSelectedItemChange(item) {
			if (item === undefined) {
				return;
			} else {
				$scope.selectedAirport = item.id;
				showInMap([$scope.selectedAirport.Position.Latitude, $scope.selectedAirport.Position.Longitude]);
				
				$scope.departure =  item.id.AirportCode;
				$scope.requestInfo = {
							locationCode: $scope.departure,
							startTime: '00:00', 
							endTime : '23:59',
							mode : $scope.mode
						}
				BritishAirways.searchFlightsByTime($scope.requestInfo, function sucess(result) {
					$scope.flightList = [];
					if (result.data.FlightsResponse.Flight instanceof Array)
						$scope.flightList = result.data.FlightsResponse.Flight;
					else 
						$scope.flightList.push(result.data.FlightsResponse.Flight); 
					
					parseFlightInformation();
					
					showAllRoutesInMap();
				}, function error(response) {
					if (response.status == 404) {
						console.log("Flights are not availble for the requested route.");
					}
				});
			}
    }
	
	$scope.parsedFlightList = [];
	 
	function parseFlightInformation() {
		$scope.parsedFlightList = [];
		angular.forEach($scope.flightList, function(flight, key) {
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
		return parsedSector;
	}
	
	function showAllRoutesInMap() {
        var coords = [];
        angular.forEach($scope.flightList, function(flight, key) {
			if (flight.Sector instanceof Array) {
                for(var i = 0; i<flight.Sector.length; i++) 
                    getCoordsOfAirport(flight.Sector[i].ArrivalAirport, "sector");
            } else {
			 getCoordsOfAirport(flight.Sector.ArrivalAirport, "airport");
            }
        }, coords);
	}
	
	function drawPath(from, to) {
		  var flightPlanCoordinates = [{
			  lat: from[0], lng: from[1]
		  }, {
			  lat: to[0], lng: to[1]
		  }];
		
		  var flightPath = new google.maps.Polyline({
			path: flightPlanCoordinates,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 1
		  });

		  flightPath.setMap($scope.mapHolder);
	}
	
	
	function getCoordsOfAirport (airportCode, mode){
		var airports = [];
        angular.forEach($rootScope.airportsList, function(airport, key) {
			if (airport.AirportCode == airportCode) {
				addToDestination(airport);
			}
        }, airports);
	}
    
    function getAllDestinations(allFlights) {
		   $scope.filteredAirportList = [];
           if (allFlights instanceof Array) {
                var flights = [];
                angular.forEach(allFlights, function(flight, key) {
                         var flightInfo = {
                               airportCode : flight.ArrivalAirport
                           };
                        this.push(flightInfo);
                     }, flights);
                $scope.filteredAirportList = allFlights;
           } else {
			   var flightInfo = {
                   airportCode : allFlights.FlightNumber
               };
               $scope.filteredAirportList.push(flightInfo);
           }
    }
    
    function getUltimateDestination(sector) {
        if (sector instanceof Array) {
            
        } else {
            return sector;
        }
    }
    
    function listAllDestinations() {
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
