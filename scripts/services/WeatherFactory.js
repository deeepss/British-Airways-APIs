BaApp.factory('WeatherServices', function($http) {
    var factory = {}; 
    var weatherApiKey = "<<YOUR API KEY>>";
    var baseUrl = "http://api.openweathermap.org/data/2.5/weather?";
    
    factory.getWeatherCondition =  function(latitude, longitude) {
        var remoteUrl = baseUrl + "lat="+latitude+"&lon="+longitude+"&APPID="+weatherApiKey;
        console.log(remoteUrl);
        $http({
                    method: "get",
                    url: remoteUrl
                }).then(function sucess(response) {
            console.log(response);
        }, 
        function error(response) {
        
        });
    }
    return factory;
});