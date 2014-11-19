

ExampleApp.directive('exWidget2', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'widget2/widget2.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.categories = [];
            scope.init = function() {
                scope.categories = MetadataService.getCategories();
            }

            scope.init();

            scope.changeCategory = function(idx) {
                console.log(idx);
                console.log(scope.categories);
                MetadataService.changeCategory(scope.categories[idx], idx);
                //$rootScope.$broadcast('filterChanged');
            };

            scope.$on('filterChanged', function() {
                console.log('filterChanged');
                scope.categories = MetadataService.getCategories();
            });
        }
    };
}]);
