var Videbligo = angular.module('Videbligo', []);

Videbligo.service('MetadataService',["$rootScope", "$location", "$http", function($rootScope, $location, $http){
    var crossData = null;
    var all = null;
    this.init = function() {
        $http({
            method: 'GET',
            url: "./assets/dist/data.json"
        }).success(function(data) {
            crossData = crossfilter(data);
            all = crossData.groupAll();
            $rootScope.$broadcast('init');
            $rootScope.$broadcast('filterChanged');
        }).error(function(data) {
            console.log("Request failed");
        });
    };
    this.init();

    this.getData = function(){
        return crossData;
    }

    this.triggerUpdate = function() {
        $rootScope.$broadcast('filterChanged');
    }

    this.length = function()
    {
        return all.value();
    }

}]);

function parseDate(input) {
    if(input == undefined)
        return undefined;
    var parts = input.split('-');
    return new Date(parts[0], parts[1], parts[2]); // Note: months are 0-based
}
