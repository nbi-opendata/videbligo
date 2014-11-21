var ExampleApp = angular.module('ExampleApp', []);

ExampleApp.controller('ExampleMainController',["$scope", function ($scope) {
}]);

ExampleApp.service('MetadataService',["$rootScope", "$location", function($rootScope, $location){

    var myfunnyvariable = 5;
    var stuff = crossfilter();

    this.init = function() {
        var self = this;
        console.log("loading data");
        $.getJSON("assets/dist/data.json", function(data){
            console.log("loaded data.json");
            self.crossData = crossfilter(data);
            self.triggerUpdate();
            myfunnyvariable = 6;
        });
    }
    this.init();

    this.getData = function(){
        return this.crossData;
    }

    this.triggerUpdate = function() {
        $rootScope.$broadcast('filterChanged');
    }

    function test()
    {
        console.log("test");
    }

}]);

