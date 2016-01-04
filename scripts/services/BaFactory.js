BaApp.factory('BritishAirways', function($rootScope, $http,$filter) {
        
    var factory = {}; 
    var clientKey = "<<CLIENT KEY>>";
    var baseUrl = "https://api.ba.com/rest-v1/v1/";
	var cabinTypes = ['economy', 'premiumEconomy', 'business','first'];
	var journeyType = ['oneWay', 'roundTrip'];
	var range = ['monthLow', 'yearRow'];

    factory.getListedLocations =  function(sucess, failed) {
        var localUrl = "json/allLocations.json";
        var remoteUrl = baseUrl + "balocations";
        $http({
                    method: "get",
                    url: localUrl,
                    headers: {'Client-Key': clientKey}
                }).then(sucess, failed);
    }

    factory.searchFlightsByRoute = function(requestInfo, sucess, failure) {
        var modeOfFlight = (requestInfo.mode == 'D') ? "scheduledDepartureDate" : "scheduledArrivalDate";
        var remoteUrl = baseUrl + "flights;departureLocation="+  requestInfo.from 
                                + ";arrivalLocation="+ requestInfo.to 
                                + ";"+ modeOfFlight +"=" + requestInfo.date +".json";
        console.log(remoteUrl);
        $http({
                    method: "get",
                    url: remoteUrl,
                    headers: {'Client-Key': clientKey}
                }).then(sucess, failure);
    }
    
    factory.searchFlightsByNumber = function(requestInfo) {
        var modeOfFlight = (requestInfo.mode == 'D') ? "scheduledDepartureDate" : "scheduledArrivalDate";
        var remoteUrl = baseUrl + "flights;flightNumber=" + requestInfo.flightNumber + ";" + modeOfFlight + '=' + requestInfo.time + ".json";
        console.log(remoteUrl);
        $http({
                    method: "get",
                    url: remoteUrl,
                    headers: {'Client-Key': clientKey}
                }).then(function sucess(response) { console.log(response.data.FlightsResponse);
                         }, 
                         function error(response) {
                            if (response.status == 404) {
                                console.log("Flights are not availble for the requested route.");
                            }
                        });
    }
    
     factory.searchFlightsByTime = function(requestInfo, sucessCallback, failedCallback) {
        var modeOfFlight = (requestInfo.mode == 'D') ? "departureLocation" : "arrivalLocation";
        var remoteUrl = baseUrl + "flights;" + modeOfFlight +"="+  requestInfo.locationCode + ";startTime=" + requestInfo.startTime + ";endTime=" + requestInfo.endTime +".json";
        console.log(remoteUrl);
        $http({
                    method: "get",
                    url: remoteUrl,
                    headers: {'Client-Key': clientKey}
                }).then(sucessCallback, failedCallback);
    }
     
    factory.searchFlightsByPrice = function(requestInfo, sucess, failed) {
		var remoteUrl = baseUrl + "flightOfferBasic;departureCity=" + requestInfo.from + ";arrivalCity="+  requestInfo.to + ";cabin=" + cabinTypes[requestInfo.moreOptions.cabinType] + ";journeyType=" + journeyType[requestInfo.moreOptions.journeyType] + ";range=" + range[requestInfo.moreOptions.range] + ".json";
        console.log(remoteUrl);
        $http({
                    method: "get",
                    url: remoteUrl,
                    headers: {'Client-Key': clientKey}
                }).then(sucess, failed);
    }
	
	factory.defaultFlightSearch = function(requestInfo, sucess, failed) {
		var cabinTypes = ['Economy', 'Business','First'];

		var timeStamp = $filter('date')( requestInfo.startDate, "yyyy-MM-dd'T'hh:mm:ss");
		var departureDateTimeOutbound = "departureDateTimeOutbound=" + timeStamp;
		var departureDateTimeInbound = '';
		
		var locationCodeOriginOutbound = "locationCodeOriginOutbound=" + requestInfo.from;
		var locationCodeDestinationOutbound = "locationCodeDestinationOutbound=" + requestInfo.to ;
		
		var locationCodeOriginInbound = "locationCodeOriginInbound=" + requestInfo.to;
		var locationCodeDestinationInbound = "locationCodeDestinationInbound=" + requestInfo.from;
		
		var cabinInfo = "cabin=" + cabinTypes[requestInfo.moreOptions.cabinType];
		if (requestInfo.moreOptions.subType) {
			cabinInfo = cabinInfo + ";subtype=Premium"
		}
		
		var adults = "ADT=" + requestInfo.moreOptions.passengers[0];
		var child = "CHD=" + requestInfo.moreOptions.passengers[1];
		var infants = "INF=" + requestInfo.moreOptions.passengers[2];
		
		var format  = 'json';
		
		var remoteUrl = baseUrl + "flightOfferMktAffiliates;" +  departureDateTimeOutbound + ";" + locationCodeOriginOutbound + ";" + locationCodeDestinationOutbound + ';'+ cabinInfo + ";"+ adults + ";" + child + ';' + infants + '.' + format;
			
        console.log(remoteUrl);
		var localUrl = "json/priced-itenary.json";
        // var localUrl = "json/default-search.json";
        $http({
                    method: "get",
                    url: remoteUrl,
                    headers: {'Client-Key': clientKey}
                }).then(sucess, failed);
    }
        
    return factory;
});