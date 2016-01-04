BaApp.factory('GoogleServices', function($http) {
    var factory = {}; 
    // AIzaSyD3XLwoR5NiE2zRMTQ_zOgHbYIvJWYVGIM
    var googleApiKey = "<<API KEY>>";
    var baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
    
    
    factory.getNearestAirport =  getNearestAirport;
    
    function getNearestAirport(location, radius, sucessCb, failedCb) {
        var location = location.lat + ','+ location.long;
        location = "12.98,77.6";
        var remoteUrl = baseUrl + "location="+location+"&radius="+radius+"&types=airport&name=international&key="+googleApiKey;
        console.log(remoteUrl);
        $http({
                    method: "get",
                    url: remoteUrl
                }).then(sucessCb, failedCb);
    }
    
    return factory;
});