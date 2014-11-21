/**
 * Created by Kadir on 21.11.2014.
 */

ExampleApp.directive('exWidget1', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'widget1/widget1.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.$on('filterChanged', function() {
                //scope.data = MetadataService.getData().dimension();
            });
        }
    };
}]);
