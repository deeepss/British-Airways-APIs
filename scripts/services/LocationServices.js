BaApp.factory('LocationServices', function($rootScope, $http) {
        
    var factory = {}; 
    var clientKey = "<<YOUR API KEY>>";
    var baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
	
	// location=-33.8670,151.1957&radius=500&types=food&name=cruise&key=YOUR_API_KEY

    factory.getNearestAirport =  function(coords, radius, sucess, failed) {
		var params = "location=" + coords[0] + ","+ coords[1] + "&radius="+ radius +"&types=airport&name=international&key="+clientKey;
        var remoteUrl = baseUrl + params;
		console.log(remoteUrl);
       	$http({
                    method: "get",
                    url: remoteUrl,
                    headers: {'Client-Key': clientKey}
                }).then(sucess, failed);
    }
    return factory;
});