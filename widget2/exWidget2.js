

ExampleApp.directive('exWidget2', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'widget2/widget2.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.crossData = [];
            scope.mydata = [];
            scope.length = 0;

            scope.init = function() {
                scope.crossData = MetadataService.getData();
            }

            scope.init();


            scope.$on('filterChanged', function() {
                console.log('filterChanged');
                var data = scope.crossData;
                if(data === undefined)
                    return;
                var all = data.groupAll();
                var dimName = data.dimension(function(d){return d.name;});
                var dimType = data.dimension(function(d){return d.type;});
                dimName.filterExact("gsi_gesindikator_11_2");
                scope.mydata = dimName.top(20);
                scope.length = all.value();
            });
        }
    };
}]);
