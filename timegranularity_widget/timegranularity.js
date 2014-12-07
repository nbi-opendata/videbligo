Videbligo.directive('timeGranularity', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'timegranularity_widget/timegranularity.html',
        scope: {
            orientation : '@'
        },
        link: function(scope, element, attrs) {
            scope.data = null;
            scope.dimTimeGranularity = null;
            scope.groupTimeGranularity = null;
            //scope.timeGranularity = {};
            if (attrs.orientation == undefined) {
                scope.orientation = 'vertical';
            }

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.dimTimeGranularity = scope.data.dimension(function(d){return d.extras.temporal_granularity;});
                scope.groupTimeGranularity = scope.dimTimeGranularity.group().all();
                scope.mapGranularities();
            }

            scope.mapGranularities = function(){
                for(var i in scope.groupTimeGranularity) {
                    if(scope.groupTimeGranularity[i].key != '') {
                        scope.timeGranularity[scope.groupTimeGranularity[i].key].elements = scope.groupTimeGranularity[i].value;
                    } else {
                        scope.timeGranularity.Others.elements = scope.groupTimeGranularity[i].value;
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
