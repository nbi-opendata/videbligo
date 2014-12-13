Videbligo.directive('geographicalGranularity', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'geographicalgranularity_widget/geographicalgranularity.html',
        scope: {
            orientation : '@',
            quantile    : '@'
        },
        link: function(scope, element, attrs) {
            scope.data = null;
            scope.geographicalDimension = null;
            scope.geographicalGranularityGroups = null;
            scope.geographicalGranularity = geographicalGranularity;
            scope.maxItemSize = 0;

            if(attrs.orientation == undefined) {
                scope.orientation = 'vertical';
            }
            if(attrs.quantile == undefined) {
                scope.quantile = 4;
            }

            scope.selectGranularity = function(item) {
                item.active = !item.active;
                console.log(item);
            };

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.geographicalDimension = scope.data.dimension(function(d){return d.extras.geographical_granularity;});
                scope.geographicalGranularityGroups = scope.geographicalDimension.group().all();
                scope.mapGranularities();
            }

            scope.mapGranularities = function(){
                for(var i in scope.geographicalGranularityGroups) {
                    if(scope.geographicalGranularityGroups[i].key != '') {
                        var key = scope.geographicalGranularityGroups[i].key.toLowerCase();
                    } else {
                        var key = 'others';
                    }
                    var allData = MetadataService.length();
                    scope.geographicalGranularity[key].elements = scope.geographicalGranularityGroups[i].value;

                    var percentage = (scope.geographicalGranularity[key].elements / allData)*100;
                    scope.geographicalGranularity[key].size = Math.ceil(percentage/(100/scope.quantile));
                    if(scope.geographicalGranularity[key].size > scope.maxItemSize) {
                        scope.maxItemSize = scope.geographicalGranularity[key].size;
                    }
                }
            }
            scope.$on('filterChanged', function() {
                scope.mapGranularities();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
