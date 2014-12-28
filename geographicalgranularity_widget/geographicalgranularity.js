Videbligo.directive('geographicalgranularity', ['MetadataService', function(MetadataService) {

    function setOptions(scope, attrs) {
        if(attrs.orientation == undefined) {
            scope.orientation = 'vertical';
        }
        if(attrs.orientation != 'vertical' || attrs.orientation != 'horizontal') {
            scope.orientation = 'vertical';
        }
        if(attrs.quantile == undefined) {
            scope.quantile = 4;
        }
    };

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
            scope.selectedGranularities = new StringSet();
            setOptions(scope, attrs);

            scope.selectGranularity = function(item) {
                item.active = !item.active;
                if(scope.selectedGranularities.contains(item.key)){
                    scope.selectedGranularities.remove(item.key);
                }else{
                    scope.selectedGranularities.add(item.key);
                }

                var filterFunction = function(d) {
                    if(d == undefined) {
                        console.log('undefined?');
                        return false;
                    }
                    if(d != '') {
                        return scope.selectedGranularities.contains(d.toLowerCase());
                    } else {
                        return scope.selectedGranularities.contains('others');
                    }
                };

                if(scope.selectedGranularities.values().length == 0) {
                    scope.geographicalDimension.filterAll();
                }else{
                    scope.geographicalDimension.filter(filterFunction);
                }

                MetadataService.triggerUpdate();
            };

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.geographicalDimension = scope.data.dimension(function(d){
                    if(d.extras != undefined && d.extras.geographical_granularity != undefined) {
                        return d.extras.geographical_granularity.toLowerCase();
                    } else {

                        return "";
                    }
                });
                scope.mapGranularities();
            }

            scope.mapGranularities = function(){
                var geographicalGranularityGroups = scope.geographicalDimension.group().all();
                for(var i in geographicalGranularityGroups) {
                    if(geographicalGranularityGroups[i].key != '') {
                        var key = geographicalGranularityGroups[i].key.toLowerCase();
                    } else {
                        var key = 'others';
                    }
                    var allData = scope.geographicalDimension.groupAll().value();
                    // changes with selection needs to be fix when only granularity is selected
                    scope.geographicalGranularity[key].elements = geographicalGranularityGroups[i].value;

                    if(allData > 0) {
                        var percentage = (scope.geographicalGranularity[key].elements / allData)*100;
                        scope.geographicalGranularity[key].size = Math.ceil(percentage/(100/scope.quantile));
                    } else {
                        scope.geographicalGranularity[key].size = 0;
                    }

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
