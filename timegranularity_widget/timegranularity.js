Videbligo.directive('search', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'timegranularity_widget/timegranularity.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.data = null;
            scope.geographicalDimension = null;

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.geographicalDimension = scope.data.dimension(function(d){return d;});
            }

            scope.$on('filterChanged', function() {
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
