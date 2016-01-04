BaApp.factory('WeatherServices', function($http) {
    var factory = {}; 
    var weatherApiKey = "<<API KEY>>";
    var baseUrl = "http://api.openweathermap.org/data/2.5/weather?";
    
    factory.getWeatherCondition =  function(latitude, longitude, airportName, callback) {
        var remoteUrl = baseUrl + "lat="+latitude+"&lon="+longitude+"&APPID="+weatherApiKey;
        console.log(remoteUrl);
        $http({
                    method: "get",
                    url: remoteUrl
                }).then(function sucess(response) {
            
			var weatherInfo = {};
			weatherInfo.icon = response.data.weather[0].icon;
			weatherInfo.coords = [latitude, longitude];
			weatherInfo.weather =  response.data.weather[0].main;
			weatherInfo.location =  airportName;
			
			callback(weatherInfo);
        }, 
        function error(response) {
        
        });
    }
    return factory;
});