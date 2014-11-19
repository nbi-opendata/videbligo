var ExampleApp = angular.module('ExampleApp', []);

ExampleApp.controller('ExampleMainController',["$scope", function ($scope) {
}]);

ExampleApp.service('MetadataService',["$rootScope", "$location", function($rootScope, $location){
    var categoryFoo = [{label: "Katgorie 1", id:"1", checked: "false"},{label: "Katgorie 2", id:"2", checked: "false"}];
    var dimension1 = [];
    var dimension2 = [];

    this.init = function() {
        var all = crossfilter.add(Data);
        this.dimension1 = all.getDimension('category');

        var settings = $location.search();
        // foo bar auf meine Kategorien
    }

    this.addCategory = function(changeCategory) {
        console.log('service:' + changeCategory);
        categoryFoo.push(changeCategory);
    }
    this.changeCategory = function(category, idx) {
        categoryFoo[idx] = category;
        $location.search('category', idx);
        $rootScope.$broadcast('filterChanged');

        // filter for dimensionCategory

    }


    this.getCategories = function () {
        // dimensionCategory with current filters
        return categoryFoo;
    }

}]);

ExampleApp.directive('exWidget1', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'widget1/widget1.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.$on('filterChanged', function() {
                scope.getData();
            });
        }
    };
}]);
