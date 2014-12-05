

Videbligo.directive('result', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'result_widget/result.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.crossData = [];
            scope.entries = [];
            scope.length = 0;
            var initialized = false;
            scope.init = function(){
                if(initialized)
                    return
                initialized = !initialized;
                var data = MetadataService.getData();
                scope.dimOne = data.dimension(function(d){return d;});
                scope.all = data.groupAll();
            }

            scope.$on('filterChanged', function() {
                scope.init();
                scope.entries = scope.dimOne.top(Infinity);
                scope.length = scope.all.value();
            });
        }
    };
}]);
