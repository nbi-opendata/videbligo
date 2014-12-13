Videbligo.directive('timegranularity', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'timegranularity_widget/timegranularity.html',
        scope: {
            orientation : '@',
            quantile    : '@'
        },
        link: function(scope, element, attrs) {
            scope.data = null;
            scope.dimTimeGranularity = null;
            scope.timeGranularityGroups = null;
            scope.timeGranularity = timeGranularity;
            if (attrs.orientation == undefined) {
                scope.orientation = 'vertical';
            }

            if(attrs.quantile == undefined) {
                scope.quantile = 4;
            }
            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.dimTimeGranularity = scope.data.dimension(function(d){return d.extras.temporal_granularity;});
                scope.timeGranularityGroups = scope.dimTimeGranularity.group().all();
                scope.mapGranularities();
            }

            scope.mapGranularities = function(){
                for(var i in scope.timeGranularityGroups) {
                    if(scope.timeGranularityGroups[i].key != '') {
                        var key = scope.timeGranularityGroups[i].key.toLowerCase();
                    } else {
                        var key = 'keine';
                    }
                    var allData = MetadataService.length();
                    scope.timeGranularity[key].elements = scope.timeGranularityGroups[i].value;

                    var percentage = (scope.timeGranularity[key].elements / allData)*100;
                    scope.timeGranularity[key].size = Math.ceil(percentage/(100/scope.quantile));
                }
            }

            scope.$on('filterChanged', function() {
                scope.mapGranularities();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
