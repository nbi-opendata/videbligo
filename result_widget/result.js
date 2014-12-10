Videbligo.directive('result', ['MetadataService', function (MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'result_widget/result.html',
        scope: {},
        link: function (scope, element, attrs) {
            scope.crossData = [];
            scope.entries = [];
            scope.length = 0;
            scope.dimOne = null;

            scope.init = function () {
                var data = MetadataService.getData();
                scope.dimOne = data.dimension(function (d) {return d;});
            }

            scope.$on('filterChanged', function () {
                scope.entries = scope.dimOne.top(1);
                scope.length = MetadataService.length();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
