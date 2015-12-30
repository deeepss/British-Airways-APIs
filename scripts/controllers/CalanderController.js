BaApp.controller('CalanderController', 
				 function($scope, $filter, $q, $timeout, $log, MaterialCalendarData, BritishAirways) {
	$scope.selectedDate = null;
    $scope.weekStartsOn = 0;
    $scope.dayFormat = "d";
    $scope.tooltips = true;
    $scope.disableFutureDates = false;

    $scope.setDirection = function(direction) {
        $scope.direction = direction;
        $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
    };

    $scope.dayClick = function(date) {
        console.log("You clicked " + $filter("date")(date, "MMM d, y h:mm:ss a Z"));
    };

    $scope.prevMonth = function(data) {
        console.log($scope.msg = "You clicked (prev) month " + data.month + ", " + data.year);
    };

    $scope.nextMonth = function(data) {
        console.log("You clicked (next) month " + data.month + ", " + data.year);
    };

    $scope.setContentViaService = function() {
        var today = new Date();
        MaterialCalendarData.setDayContent(today, '<span> :oD </span>')
    }

    var allFlights = {};

    // You would inject any HTML you wanted for
    // that particular date here.
    var numFmt = function(num) {
        num = num.toString();
        if (num.length < 2) {
            num = "0" + num;
        }
        return num;
    };

    var loadContentAsync = true;
    $log.info("setDayContent.async", loadContentAsync);
    $scope.setDayContent = function(date) {
        var key = [date.getFullYear(), numFmt(date.getMonth()+1), numFmt(date.getDate())].join("-");
        var data = (allFlights[key]||[{ name: ""}])[0].name;
        if (loadContentAsync) {
            var deferred = $q.defer();
            $timeout(function() {
                deferred.resolve(data);
            });
            return deferred.promise;
        }
        return data;
    };
});
