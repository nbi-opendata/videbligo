Videbligo.directive('geographicalGranularity', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'geographicalgranularity_widget/geographicalgranularity.html',
        scope: {
            orientation : '@'
        },
        link: function(scope, element, attrs) {
            scope.data = null;
            scope.geographicalDimension = null;
            scope.geographicalGranularityGroups = null;
            scope.geographicalGranularity = geographicalGranularity;
            if(attrs.orientation == undefined) {
                scope.orientation = 'vertical';
            }

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.geographicalDimension = scope.data.dimension(function(d){return d.extras.geographical_granularity;});
                scope.geographicalGranularityGroups = scope.geographicalDimension.group().all();
                scope.mapGranularities();
            }

            scope.mapGranularities = function(){
                for(var i in scope.geographicalGranularityGroups) {
                    if(scope.geographicalGranularityGroups[i].key != '') {
                        scope.geographicalGranularity[scope.geographicalGranularityGroups[i].key].elements = scope.geographicalGranularityGroups[i].value;
                    } else {
                        scope.geographicalGranularity.Others.elements = scope.geographicalGranularityGroups[i].value;
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
