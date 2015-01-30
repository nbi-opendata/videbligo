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
            //initial zoom previous 25 years
            scope.zoomFirst = d3.time.year.offset(d3.time.year(new Date()), -25);

            scope.dimDate = {};
            scope.groupDate = {};
            scope.cachedGrouping = [];

            //current highest value withing zoomed range
            scope.maxYValue = 0;

            //even if there are less datasets than this value
            //this value will be used as maximum Y value
            scope.minYAxisHeight = 5;

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
                    scope.showZoomChart = (attrs.showZoomChart.toLowerCase() === "true");
                }
                if(attrs.minYValue) {
                    scope.minYAxisHeight = parseInt(attrs.minYValue);
                }

                //custom tick format for the x axis
                //different zoom levels will cause different formats to be rendered
                //see https://github.com/mbostock/d3/wiki/Time-Formatting
                scope.tickFormat = d3.time.format.multi([
                    ["", function(d) { return d.getMilliseconds(); }],
                    ["", function(d) { return d.getSeconds(); }],
                    ["", function(d) { return d.getMinutes(); }],
                    ["", function(d) { return d.getHours(); }],
                    ["", function(d) { return d.getDay() && d.getDate() != 1; }],
                    ["", function(d) { return d.getDate() != 1; }],
                    ["", function(d) { return d.getMonth(); }],
                    ["%Y", function() { return true; }]
                ]);

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

            scope.initCharts = function(){
                scope.debounceTriggerUpdate = debounce(function (chart, filter) {
                    MetadataService.triggerUpdate(this);
                }, 250);

                var all = scope.groupDate.all();
                scope.first = all[0].key;
                scope.first = d3.time.year.offset(scope.first, -1);
                scope.last = all[all.length-1].key;
                scope.last = d3.time.year.offset(scope.last, 1);

                scope.chart = dc.barChart('#time-chart');

                if (scope.showZoomChart){
                    scope.zoomChart = dc.barChart('#time-zoom-chart');
                    scope.zoomChart
                        .width(scope.chartWidth)
                        .height(35)
                        .margins({top: 0, right: 10, bottom: 18, left: 30})
                        .dimension(scope.dimDate)
                        .group(scope.groupDate)
                        .centerBar(true)
                        .gap(1)
                        .x(d3.time.scale().domain([scope.first, scope.last]))
                        .y(d3.scale.sqrt().exponent(0.3).domain([0,scope.maxYValue]))
                        .round(scope.formatter.round)
                        .xUnits(scope.formatter.range);

                    scope.zoomChart.filterHandler(function(dimension, filter){
                        angular.element("#time-chart-reset").css("visibility","visible");
                        scope.chart.focus(scope.zoomChart.filter());
                        scope.chart.filterAll();
                        return filter;
                    });
                }

                scope.chart
                    .width(scope.chartWidth)
                    .height(scope.chartHeight)
                    .margins({top: 5, right: 10, bottom: 18, left: 30})
                    .dimension(scope.dimDate)
                    .group(scope.groupDate)
                    .x(d3.time.scale().domain([scope.first, scope.last]))
                    .y(d3.scale.sqrt().exponent(0.7).domain([0,scope.maxYValue]))
                    .brushOn(true)
                    .gap(1)
                    .centerBar(true)
                    //.elasticY(true)
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .yAxis().tickFormat(d3.format("d"));
                scope.chart
                    .xAxis().tickFormat(scope.tickFormat);

                scope.chart.filterHandler(function(dimension, filter){
                    angular.element("#time-chart-reset").css("visibility","visible");
                    return scope.filterFunction(dimension, filter);
                });

                scope.chart.on("filtered", function(chart, filter){
                    scope.debounceTriggerUpdate();
                });

                dc.renderAll();

                if(scope.showZoomChart){
                    scope.zoomChart.filter([scope.zoomFirst, new Date()]);
                    angular.element("#time-chart-reset").css("visibility","hidden");
                }
            };

            //custom grouping is time consuming, so it needs to be precached
            scope.precacheGrouping = function (){
                scope.maxYValue = 0;
                var newObject = [];
                var val = scope.groupDate;
                for (var key in val) {
                    if (val.hasOwnProperty(key) && key != "all") {
                        scope.binaryInsert({key: new Date(key), value: val[key]}, newObject);
                    }
                }
                if (scope.zoomChart != undefined && scope.zoomChart.filter() != null){
                    var filter = scope.zoomChart.filter();
                    newObject.forEach(function (entry) {
                        if (entry.value > scope.maxYValue){
                            if(filter[0] <= entry.key && entry.key <= filter[1]){
                                scope.maxYValue = entry.value;
                            }
                        }
                    });
                }
                else {
                    newObject.forEach(function (entry) {
                        if (entry.value > scope.maxYValue){
                            scope.maxYValue = entry.value;
                        }
                    });
                }
                if (scope.maxYValue < scope.minYAxisHeight){
                    scope.maxYValue = scope.minYAxisHeight;
                }
                scope.cachedGrouping = newObject;
            };

            /*
                custom filter function
             */
            scope.filterFunction = function(dimension, filter){
                //if the filter is set, take its left and right value
                if (filter.length > 0){
                    var filterStart = filter[0][0];
                    var filterEnd = filter[0][1];

                    dimension.filterFunction(function(d){
                        //should actually never happen
                        if (d.length == 1){
                            return filterStart <= d[0] && d[0] <= filterEnd;
                        }

                        //take first and last date from the dataset's range
                        var dimStart = d[0];
                        var dimEnd = d[d.length - 1];

                        //four possibilities that two ranges intersect
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
                    //if the filter is not set, take all values
                    dimension.filterAll();
                }

                return filter;
            };

            /*
                used in precacheGrouping()
                this function makes sure that the array in which we insert a {key: Date, value: Integer}-object
                stays sorted
                (faster than usual inserting + sorting afterwards)
            */
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

            /*
                when the filters change, the grouping needs to be calculated again
                and the y-axis height needs to be adjusted
             */
            scope.$on('filterChanged', function() {
                scope.precacheGrouping();
                scope.adjustYAxes();
            });

            /*
                reset function clears the zoom on the main chart (if the zoom chart is being used),
                removes any filters from the main chart
                and hides the reset button
             */
            scope.reset = function(){
                if (scope.showZoomChart){
                    scope.zoomChart.filterAll();
                    scope.zoomChart.filter([scope.zoomFirst,scope.last]);
                    scope.precacheGrouping();
                    scope.adjustYAxes();
                }
                scope.chart.filterAll();
                angular.element("#time-chart-reset").css("visibility","hidden");
                MetadataService.triggerUpdate();
            };


            scope.$on('globalreset', function() {
                scope.reset();
            });

            scope.adjustYAxes = function () {
                var newScale = d3.scale.sqrt().exponent(0.7).domain([0,scope.maxYValue])
                    .range(scope.chart.yAxis().scale().range());
                scope.chart.y(d3.scale.sqrt().exponent(0.7).domain([0,scope.maxYValue]));
                scope.chart.yAxis().scale(newScale);
                scope.chart.renderYAxis(scope.chart.g());
                dc.redrawAll();
            };

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
