BaApp.controller('SearchController', function($scope,$filter, $mdDialog,$timeout, $q, $log, $rootScope, BritishAirways){
	$scope.departure = 'a';
	$scope.arrival = 'd';
	
    $scope.showResults = false;
    $scope.flightList = [];
    $rootScope.filteredFlightsList = [];
	
    $scope.startDate = new Date();
	$scope.endDate  = $scope.startDate;
	
    $scope.minDate = new Date(
          $scope.startDate.getFullYear(),
          $scope.startDate.getMonth(),
          $scope.startDate.getDate());
	
    $scope.maxDate = new Date(
          $scope.startDate.getFullYear(),
          $scope.startDate.getMonth(),
          $scope.startDate.getDate()+14);
    
	$scope.dCountry = {};
	$scope.dCity = {};
	$scope.dAirport = {};
	
	$scope.aCountry = {};
	$scope.aCity = {};
    $scope.aAirport = {};
	
    $scope.moreOptions = {
        journeyType : 0,
        cabinType : 0,
		range : 0,
        passengers : [1, 0, 0]
    }
	
	$scope.iteneraryList = [];
	
    $scope.populateDCities = function() {
		if ($scope.dCountry.City instanceof Array) {
            $scope.departure = "";
        } else {
			$scope.dCity = $scope.dCountry.City;
			$scope.populateDAirports();
        }
    }
	
	 $scope.populateACities = function() {
        if ($scope.aCountry.City instanceof Array) {
            $scope.arrival = "";
        } else 
			$scope.aCity = $scope.aCountry.City;
		 	$scope.populateAAirports();
    }
	 
	 $scope.populateDAirports = function() {
        if ($scope.dCity.Airport instanceof Array) {
            $scope.departure = "";
        } else  {
			$scope.dAirport = $scope.dCity.Airport;
			$scope.setDeparture();
        }
    }
    
	$scope.populateAAirports = function() {
        if ($scope.aCity.Airport instanceof Array) {
            $scope.arrival = "";
       	} else 
        	$scope.aAirport = $scope.aCity.Airport;
			$scope.setArrival();
    }
	 
    $scope.setArrival = function() {
		$scope.arrival = $scope.aAirport.AirportCode;
		console.log("Arraival airport information : " + $scope.aAirport);
    }
    
    $scope.setDeparture = function() {
        $scope.departure = $scope.dAirport.AirportCode;
		console.log("Departure airport information : " + $scope.dAirport);
    }
    
    $scope.searchFlights = function() {
		var formattedDate = $filter('date')($scope.startDate, "yyyy-MM-dd'T'hh:mm:ssZ");
		formattedDate = $filter('date')($scope.startDate, "yyyy-MM-dd");
        
		var requestInfo = {
            from: $scope.departure,
            to: $scope.arrival, 
            startDate : $scope.startDate,
            moreOptions : $scope.moreOptions
        }
		
		BritishAirways.defaultFlightSearch(requestInfo, function sucess(response) {
				var obj = response.data.OTA_AirLowFareSearchRS.PricedItineraries.PricedItinerary;
				var tempArry = [];
				if (obj instanceof Array) 
					tempArry = obj;
				 else 
					tempArry.push(obj);
			
				$scope.parseIteneraryInformation(tempArry);
			
			}, function failed(error) {
				 $scope.flightList = [];
				if (error.status == 404) 
					$rootScope.showNoFlights();
				 else 
					console.log(error);
			});
	}
	
	$scope.parseIteneraryInformation = function (iteneraryArray) {
		var tempArr = [];
		angular.forEach(iteneraryArray, function(item, key) {
			var itenerary = {};
			var destinationObj = item.AirItinerary.OriginDestinationOptions.OriginDestinationOption;
			var priceObj = item.AirItineraryPricingInfo.ItinTotalFare;
			
			itenerary.journeySegment = getJourneySegment(destinationObj);
			itenerary.priceInfo = getFareDetails(priceObj);
			
			this.push(itenerary);
        }, tempArr);
		
		$scope.iteneraryList = tempArr;
		
		function getFareDetails(priceObj) {
			var fareDetails = {};
			fareDetails.baseFare = priceObj.BaseFare["@Amount"];
			fareDetails.currency = priceObj.BaseFare["@CurrencyCode"];
			fareDetails.total = priceObj.Taxes.Tax["@Amount"];
			fareDetails.tax = priceObj.TotalFare["@Amount"];
			return fareDetails;
		}
		
		
		function getJourneySegment(destinationObj) {
			var journeySegment = [];
			var flightInfo = {};
			if (destinationObj instanceof Array) {
				var airline = {};
				for (var i = 0; i < destinationObj.length ; i++) {
					airline.name = destinationObj[i].FlightSegment.OperatingAirline["@CompanyShortName"];
					airline.number = destinationObj[i].FlightSegment["@FlightNumber"];

					flightInfo.airlineDetails = airline;

					journeySegment[i] = retriveFlightInfo(destinationObj[i].FlightSegment);
				}
			} else {
				var airline = {};
				airline.name = destinationObj.FlightSegment.OperatingAirline["@CompanyShortName"];
				airline.number = destinationObj.FlightSegment["@FlightNumber"];
				flightInfo.airlineDetails = airline;

				journeySegment[0] = retriveFlightInfo(destinationObj.FlightSegment);
			}
			return journeySegment;
		}
		
		function retriveFlightInfo(flightSegment) {
			var flightInfo = {};
			var airline = {}, fareDetails = {}, locDetails = {}, timeDetails = {}, dateDetails = {};
			
			airline.name = flightSegment.OperatingAirline["@CompanyShortName"];
			airline.number = flightSegment["@FlightNumber"];
			
			locDetails.start = flightSegment.DepartureAirport["@LocationCode"];
			locDetails.end = flightSegment.ArrivalAirport["@LocationCode"];
				
			
			var arrTimeStamp = flightSegment["@ArrivalDateTime"];
			var depTimeStamp = flightSegment["@DepartureDateTime"];
			
			dateDetails.start = $filter('date')(depTimeStamp, "dd MMM yyyy");
			dateDetails.end = $filter('date')(arrTimeStamp, "dd MMM yyyy");
			
			timeDetails.start = $filter('date')(depTimeStamp, "hh:mm 'hrs'");
			timeDetails.end = $filter('date')(arrTimeStamp, "hh:mm 'hrs'");
			
			console.log(dateDetails.start);
			console.log(dateDetails.end);
			console.log(timeDetails.start);
			console.log(timeDetails.end);
			
			flightInfo.locDetails = locDetails;
			flightInfo.timeDetails = timeDetails;
			flightInfo.airlineDetails = airline;
			flightInfo.dateDetails = dateDetails;
			
			return flightInfo;
		}
	}
	
    $scope.hasHops = function(sector) {
        return (sector instanceof Array)
    };
	
});
