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
        if(attrs.initState == 'allSelected') {
            scope.initState = 'allSelected';
        } else {
            scope.initState = '';
        }
        if(attrs.withLine == 'false') {
            scope.withLine = false;
        } else {
            scope.withLine = true;
        }

    }

    return {
        restrict: 'AE',
        templateUrl: 'geographicalgranularity_widget/geographicalgranularity.html',
        scope: {
            orientation : '@',
            quantile    : '@',
            initState   : '@',
            withLine    : '@'
        },
        link: function(scope, element, attrs) {
            scope.data = null;
            scope.geographicalDimension = null;
            scope.geographicalGranularityGroups = null;
            scope.geographicalGranularity = geographicalGranularity;
            scope.maxItemSize = 0;
            scope.selectedGranularities = new StringSet();
            scope.allSelected = false;

            setOptions(scope, attrs);

            scope.selectGranularity = function(item) {
                if(scope.initState == 'allSelected' && scope.allSelected) {
                    for(var i in scope.geographicalGranularity) {
                        scope.geographicalGranularity[i].active = false;
                    }
                    scope.allSelected = false;
                }
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


            scope.reset = function() {
                if(scope.initState == 'allSelected') {
                    for(var i in scope.geographicalGranularity) {
                        scope.geographicalGranularity[i].active = true;
                    }
                    scope.allSelected = true;
                } else {
                    for(var i in scope.geographicalGranularity) {
                        scope.geographicalGranularity[i].active = false;
                    }
                }
                scope.geographicalDimension.filterAll();
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
                if(scope.initState == 'allSelected') {
                    for(var i in scope.geographicalGranularity) {
                        scope.geographicalGranularity[i].active = true;
                    }
                    scope.allSelected = true;
                }
                scope.mapGranularities();
            }

            scope.mapGranularities = function(){
                var geographicalGranularityGroups = scope.geographicalDimension.group().all();
                scope.maxItemSize = 0;


                for(var i in scope.geographicalGranularity) {
                    scope.geographicalGranularity[i].size = 0;
                    scope.geographicalGranularity[i].elements = 0;
                }

                for(var i in geographicalGranularityGroups) {
                    if(geographicalGranularityGroups[i].key != '') {
                        var key = geographicalGranularityGroups[i].key.toLowerCase();
                    } else {
                        var key = 'others';
                    }
                    var allData = scope.geographicalDimension.groupAll().value();
                    // changes with selection needs to be fix when only granularity is selected
                    scope.geographicalGranularity[key].elements = scope.geographicalGranularity[key].elements  + geographicalGranularityGroups[i].value;

                    if(allData > 0) {
                        var percentage = (scope.geographicalGranularity[key].elements / allData)*100;
                        var size = Math.ceil(percentage/(100/scope.quantile));
                        if(size > scope.geographicalGranularity[key].size) {
                            scope.geographicalGranularity[key].size = size;
                        }
                    } else {
                        scope.geographicalGranularity[key].size = 0;
                    }

                    if(scope.geographicalGranularity[key].size > scope.maxItemSize) {
                        scope.maxItemSize = scope.geographicalGranularity[key].size;
                    }
                }
            };
            scope.$on('filterChanged', function() {
                scope.mapGranularities();
            });

            scope.$on('globalreset', function() {
                console.log('catch globalreset granularity');
                scope.reset();
            });


            MetadataService.registerWidget(scope.init);
        }
    };
}]);
