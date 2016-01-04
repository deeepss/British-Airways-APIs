BaApp.controller('StatisticsController', function($scope, $filter, $rootScope, BritishAirways, LuftahnsaFactory){
	$scope.dAirport = {};
	$scope.aAirport = {};
	$scope.today = $filter('date')(new Date(), "yyyy-MM-dd");
	
	$scope.airportsArray = $rootScope.airportsList;
	
	$scope.airwaysList = [];
	$scope.baFlights = [];
	$scope.lufFlights = [];
	
	$scope.searchFlights = function() {
        $scope.airwaysList = [];
		$scope.requestInfo = {
			from : $scope.dAirport.AirportCode,
			to	 : $scope.aAirport.AirportCode,
			date : $scope.today,
			mode : 'D'
		};
		
        BritishAirways.searchFlightsByRoute($scope.requestInfo, function sucess(response) {
			var flights = [];
			if (response.data.FlightsResponse.Flight instanceof Array)
				addFlightsInformationToBA(response.data.FlightsResponse.Flight);
			else 
				addFlightsInformationToBA(flights.push(response.data.FlightsResponse.Flight));
		}, function error(err) {
			showNoFlightsInThisRoute("British Airways");
		});
		
		LuftahnsaFactory.searchFlightsByRoute($scope.requestInfo, function sucess(data) {
			var flights = data.FlightStatusResource.Flights.Flight;
			addFlightsToLuftahnsa(flights);
		}, function error(err) {
			showNoFlightsInThisRoute("Lufthansa Airways");
		});
	};
    
        function showNoFlightsInThisRoute(airwaysName) {
            var airways = {};
			airways.name = airwaysName;
            airways.flights = [];
            $scope.airwaysList.push(airways);
        }
	
		function addFlightsToLuftahnsa(flightsArray) {
			var airways = {};
			airways.name = "Lufthansa Airways";
			
			$scope.lufFlights = [];
			angular.forEach(flightsArray, function(flight, key) {
				var parsedFlight = {
					sectors : []
				};
				parsedFlight.flightNumber = flight.OperatingCarrier.FlightNumber; 
				
				parsedFlight.sectors[0] = getLufthansaFlightInformation(flight);

				$scope.lufFlights.push(parsedFlight);
				
			}, $scope.lufFlights);
			
			airways.flights = $scope.lufFlights;
			
			$scope.airwaysList.push(airways);
		}
		
		function getLufthansaFlightInformation(sector) {
			var parsedSector = {};
			parsedSector.aAirportCode = sector.Arrival.AirportCode;
			
			parsedSector.dAirportCode = sector.Departure.AirportCode;
			parsedSector.depDate = $filter('date')(sector.Departure.ScheduledTimeUTC.DateTime, "dd MMM yyyy");
			parsedSector.arrDate = $filter('date')(sector.Arrival.ScheduledTimeUTC.DateTime, "dd MMM yyyy");
			
			
			parsedSector.arrTime = $filter('date')(sector.Arrival.ScheduledTimeUTC.DateTime, "hh:mm 'hrs'");
			parsedSector.depTime = $filter('date')(sector.Departure.ScheduledTimeUTC.DateTime, "hh:mm 'hrs'");
			
			parsedSector.dTerminal = sector.Departure.Terminal.Name;
			parsedSector.aTerminal = sector.Arrival.Terminal.Name;
			
			parsedSector.depStatus = sector.Departure.TimeStatus.Definition;
			parsedSector.arrStatus = sector.Arrival.TimeStatus.Definition;

			return parsedSector;
		}	
	
		function addFlightsInformationToBA(flightsArray) {
			$scope.baFlights = [];
			angular.forEach(flightsArray, function(flight, key) {
				var parsedFlight = {
					sectors : []
				};
				parsedFlight.flightNumber = flight.FlightNumber; 
				if (flight.Sector instanceof Array) {
					for(var i = 0; i < flight.Sector.length; i++) {
						parsedFlight.sectors[i] = getBAFlightInformation(flight.Sector[i]);
					} 
				} else 
					parsedFlight.sectors[0] = getBAFlightInformation(flight.Sector);

				$scope.baFlights.push(parsedFlight);
			}, $scope.baFlights);
			
			var airways = {};
			airways.name = "British Airways";
			airways.flights = $scope.baFlights;
			
			$scope.airwaysList.push(airways);
		}
		
		function getBAFlightInformation(sector) {
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
});

