Videbligo.directive('timegranularity', ['MetadataService', function(MetadataService) {

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
        templateUrl: 'timegranularity_widget/timegranularity.html',
        scope: {
            orientation : '@',
            quantile    : '@'
        },
        link: function(scope, element, attrs) {
            scope.data = null;
            scope.timeDimension = null;
            scope.timeGranularityGroups = null;
            scope.timeGranularity = timeGranularity;
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
                        return scope.selectedGranularities.contains('keine');
                    }
                };

                if(scope.selectedGranularities.values().length == 0) {
                    scope.timeDimension.filterAll();
                }else{
                    scope.timeDimension.filter(filterFunction);
                }

                MetadataService.triggerUpdate();
            };

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.timeDimension = scope.data.dimension(function(d){
                    if(d.extras != undefined && d.extras.temporal_granularity != undefined) {
                        return d.extras.temporal_granularity.toLowerCase();
                    } else {

                        return "";
                    }
                });
                scope.mapGranularities();
            }

            scope.mapGranularities = function(){
                var timeGranularityGroups = scope.timeDimension.group().all();
                for(var i in timeGranularityGroups) {
                    if(timeGranularityGroups[i].key != '') {
                        var key = timeGranularityGroups[i].key.toLowerCase();
                    } else {
                        var key = 'keine';
                    }
                    var allData = scope.timeDimension.groupAll().value();
                    // changes with selection needs to be fix when only granularity is selected
                    scope.timeGranularity[key].elements = timeGranularityGroups[i].value;

                    if(allData > 0) {
                        var percentage = (scope.timeGranularity[key].elements / allData)*100;
                        scope.timeGranularity[key].size = Math.ceil(percentage/(100/scope.quantile));
                    } else {
                        scope.timeGranularity[key].size = 0;
                    }

                    if(scope.timeGranularity[key].size > scope.maxItemSize) {
                        scope.maxItemSize = scope.timeGranularity[key].size;
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
