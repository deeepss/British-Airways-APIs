BaApp.factory('LuftahnsaFactory', function($rootScope, $http, $filter) {
        
    var factory = {}; 
    
	var accessToken = {
		token : "",
		tokenType : "",
		expiry : ""
	};
	
	var oAuthRequestParams = {
		client_id :  LUF_CLIENT_ID  , 
		client_secret: LUF_CLIENT_SECRET,
		grant_type : LUF_CLIENT_CREDENTIALS
	}
	
    var baseUrl = "https://api.lufthansa.com/v1/";

	factory.getOauthToken = function(callBack) {
		var remoteUrl = "https://api.lufthansa.com/v1/oauth/token";
		$http({
			method: 'POST',
			url: remoteUrl,
			headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			transformRequest: function(obj) {
				var str = [];
				for(var p in obj)
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				return str.join("&");
			},
			data: {
				client_id: oAuthRequestParams.client_id, 
				client_secret: oAuthRequestParams.client_secret,
				grant_type: oAuthRequestParams.grant_type
			}
		}).success(function (response) {
			accessToken.token = response.access_token;
			accessToken.expiry = response.expires_in;
			accessToken.tokenType = response.token_type;
			callBack();
			//factory.getNearestAirports(1,1);
			
		}).error(function (error) {
			console.log(error);
		});
	}
	
    factory.getNearestAirports =  function(position, callback) {
        var remoteUrl = baseUrl + "references/airports/nearest/" + position;
        $http({
                    method: 'GET',
                    url: remoteUrl,
                    headers: {'Authorization': "Bearer " +accessToken.token }
                }).success(function (response) {
					callback(response);
		}).error(function (error) {
			console.log(error);
		});
    }

	factory.searchFlightsByRoute = function(requestInfo, sucess, failure) {
        var remoteUrl = baseUrl + "operations/flightstatus/route/" +  
			requestInfo.from +'/' + requestInfo.to + '/' + requestInfo.date;
		$http({
                    method: 'GET',
                    url: remoteUrl,
                    headers: {'Authorization': "Bearer " +accessToken.token }
                }).success(function (response) {
					sucess(response);
		}).error(function (error) {
			failure(error);
		});
    }
    
	
	
	//
    factory.searchFlightsByNumber = function(requestInfo) {
        var localUrl = "json/lonToBlr.json";
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
	
	factory.searchFlightsTemp = function(requestInfo, sucess, failed) {
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
		
		var remoteUrl = baseUrl + "flightOfferMktAffiliates;" +  departureDateTimeOutbound + ";" + locationCodeOriginOutbound + ";" + locationCodeDestinationOutbound + ';'+ cabinInfo + ";"+ adults + ";" + child + ';' + infants + ';' + format;
        $http({
                    method: "get",
                    url: localUrl,
                    headers: {'Client-Key': clientKey}
                }).then(sucess, failed);
    }
        
    return factory;
});