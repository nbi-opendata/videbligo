Videbligo.directive('date', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'date_widget/date.html',
        scope: {},
        link: function(scope, element, attrs) {

            //used to determine x axes domain for both charts
            scope.formatter = d3.time.year;

            //params injected from index.html
            scope.chartWidth = 500;
            scope.chartHeight = 170;
            scope.showZoomChart = true;

            scope.dimDate = {};
            scope.groupDate = {};
            scope.cachedGrouping = [];

            scope.getD3TimeRange = function(data){
                var dateFrom = parseDate(data.extras["temporal_coverage-from"]);

                if (dateFrom != undefined){
                    dateFrom = scope.formatter.floor(dateFrom);
                }

                var dateTo = parseDate(data.extras["temporal_coverage-to"]);
                if (dateTo != undefined){
                    dateTo = scope.formatter.ceil(dateTo);
                }

                return scope.formatter.range(dateFrom, dateTo);
            };


            scope.init = function(){
                if(attrs.chartWidth) {
                    scope.chartWidth = parseInt(attrs.chartWidth);
                }
                if(attrs.chartHeight) {
                    scope.chartHeight = parseInt(attrs.chartHeight);
                }
                if(attrs.showZoomChart) {
                    scope.showZoomChart = (attrs.showZoomChart === "true");
                }

                var data = MetadataService.getData();

                scope.dimDate = data.dimension(function(d){
                    return scope.getD3TimeRange(d);
                });

                scope.groupDate = scope.dimDate.groupAll().reduce(
                    function (p,v){
                        scope.getD3TimeRange(v).forEach (function(val, idx) {
                            p[val] = (p[val] || 0) + 1;
                        });
                        return p;
                    },
                    function (p,v) {
                        scope.getD3TimeRange(v).forEach (function(val, idx) {
                            p[val] = (p[val] || 0) - 1;
                        });
                        return p;
                    },
                    function (){
                        return {};
                    }
                ).value();

                scope.precacheGrouping();

                //adding functions to simulate the group of crossfilter
                scope.groupDate.all = function() {
                    return scope.cachedGrouping;
                };

                scope.initCharts();
            };

            scope.precacheGrouping = function (){
                    var newObject = [];
                    var val = scope.groupDate;
                    for (var key in val) {
                        if (val.hasOwnProperty(key) && key != "all") {
                            scope.binaryInsert({key: new Date(key), value: val[key]}, newObject);
                        }
                    }
                    scope.cachedGrouping = newObject;
            };

            scope.initCharts = function(){
                scope.debounceTriggerUpdate = debounce(function (chart, filter) {
                    MetadataService.triggerUpdate(this);
                }, 250);

                var all = scope.groupDate.all();
                scope.first = all[0].key;
                scope.last = all[all.length-1].key;

                scope.chart = dc.barChart('#time-chart');

                if (scope.showZoomChart){
                    scope.zoomChart = dc.barChart('#time-zoom-chart');
                    scope.zoomChart
                        .width(scope.chartWidth)
                        .height(35)
                        .margins({top: 0, right: 20, bottom: 18, left: 30})
                        .dimension(scope.dimDate)
                        .group(scope.groupDate)
                        .centerBar(true)
                        .gap(1)
                        .x(d3.time.scale().domain([scope.first, scope.last]))
                        .y(d3.scale.sqrt().exponent(0.3).domain([0,400]))
                        .round(scope.formatter.round)
                        .xUnits(scope.formatter.range);

                    scope.zoomChart.filterHandler(function(dimension, filter){
                        scope.chart.focus(scope.zoomChart.filter());
                        scope.chart.filterAll();
                        return filter;
                    });
                }

                scope.chart
                    .width(scope.chartWidth)
                    .height(scope.chartHeight)
                    .margins({top: 10, right: 20, bottom: 18, left: 30})
                    .dimension(scope.dimDate)
                    .group(scope.groupDate)
                    .x(d3.time.scale().domain([scope.first, scope.last]))
                    .y(d3.scale.sqrt().exponent(0.7).domain([0,400]))
                    .brushOn(true)
                    .gap(1)
                    .centerBar(true)
                    //.elasticY(true)
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .title(function(d){
                        return d.x.getFullYear() +": " + d.y;
                    })
                    .yAxis().tickFormat(d3.format("d"));

                scope.chart.filterHandler(function(dimension, filter){
                    return scope.filterFunction(dimension, filter);
                });

                scope.chart.on("filtered", function(chart, filter){
                    scope.debounceTriggerUpdate();
                });

                dc.renderAll();

                if(scope.showZoomChart){
                    scope.zoomChart.filter([new Date("01/01/1990"),new Date()]);
                }
            };

            scope.filterFunction = function(dimension, filter){
                if (filter.length > 0){
                    var filterStart = filter[0][0];
                    var filterEnd = filter[0][1];

                    dimension.filterFunction(function(d){
                        if (d.length == 1){
                            return filterStart <= d[0] && d[0] <= filterEnd;
                        }

                        var dimStart = d[0];
                        var dimEnd = d[d.length - 1];

                        if (dimStart <= filterStart && dimEnd >= filterEnd){
                            return true;
                        }
                        if (dimStart >= filterStart && dimEnd <= filterEnd){
                            return true;
                        }
                        if (dimStart <= filterStart && dimEnd >= filterStart){
                            return true;
                        }
                        if (dimStart <= filterEnd && dimEnd >= filterEnd){
                            return true;
                        }
                        return false;
                    });
                }
                else {
                    dimension.filterAll();
                }

                return filter;
            };

            scope.binaryInsert = function(value, array, startVal, endVal){
                var length = array.length;
                var start = typeof(startVal) != 'undefined' ? startVal : 0;
                var end = typeof(endVal) != 'undefined' ? endVal : length - 1;
                var m = start + Math.floor((end - start)/2);

                if(length == 0){
                    array.push(value);
                }
                else if(value.key.getTime() > array[end].key.getTime()){
                    array.splice(end + 1, 0, value);
                }
                else if(value.key.getTime() < array[start].key.getTime()){
                    array.splice(start, 0, value);
                }
                else if(start >= end){
                }
                else if(value.key.getTime() < array[m].key.getTime()){
                    scope.binaryInsert(value, array, start, m - 1);
                }
                else if(value.key.getTime() > array[m].key.getTime()){
                    scope.binaryInsert(value, array, m + 1, end);
                }
            };

            scope.$on('filterChanged', function() {
                scope.precacheGrouping();
                dc.redrawAll();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
