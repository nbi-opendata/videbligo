Videbligo.directive('lastmodification', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'lastmodification_widget/lastmodification.html',
        scope: {},
        link: function(scope, element, attrs) {

            //used to determine x axes domain for the charts
            scope.formatter = d3.time.week;

            //which language should the months on the x-axis be in
            //alternatively, for english, use 'd3.time.format'
            scope.locale = germanLocale.timeFormat;

            //params injected from index.html
            scope.chartWidth = 500;
            scope.chartHeight = 170;
            scope.showZoomChart = true;
            //initial zoom to beginning of the previous calendar year
            scope.zoomFirst = d3.time.year.offset(d3.time.year(new Date()), -1);

            scope.groupLastMod = {};
            scope.dimLastMod = {};

            //current highest value withing zoomed range
            scope.maxYValue = 0;

            //even if there are less datasets than this value
            //this value will be used as maximum Y value
            scope.minYAxisHeight = 5;

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
                scope.tickFormat = scope.locale.multi([
                    [".%L", function(d) { return d.getMilliseconds(); }],
                    [":%S", function(d) { return d.getSeconds(); }],
                    ["%I:%M", function(d) { return d.getMinutes(); }],
                    ["%I %p", function(d) { return d.getHours(); }],
                    ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
                    ["%d. %b", function(d) { return d.getDate() != 1; }],
                    ["%b", function(d) { return d.getMonth(); }],
                    ["%Y", function() { return true; }]
                ]);

                var data = MetadataService.getData();
                scope.dimLastMod = data.dimension(function(d){
                    return scope.formatter(new Date(d.metadata_modified));
                });

                scope.groupLastMod = scope.dimLastMod.group();
                scope.last = new Date(scope.dimLastMod.top(1)[0].metadata_modified);
                scope.first = new Date(scope.dimLastMod.bottom(1)[0].metadata_modified);
                scope.calculateMaxY();

                scope.debounceTriggerUpdate = debounce(function () {
                    MetadataService.triggerUpdate(this);
                }, 250);

                if (scope.showZoomChart){
                    scope.zoomChart = dc.barChart('#last-modification-zoom-chart');
                    scope.zoomChart
                        .width(scope.chartWidth)
                        .height(35)
                        .margins({top: 0, right: 10, bottom: 18, left: 30})
                        .dimension(scope.dimLastMod)
                        .group(scope.groupLastMod)
                        .centerBar(true)
                        .gap(1)
                        .x(d3.time.scale().domain([scope.first, scope.last]))
                        .y(d3.scale.sqrt().exponent(0.3).domain([0,scope.maxYValue]))
                        .round(scope.formatter.round)
                        .xUnits(scope.formatter.range);

                    scope.zoomChart.filterHandler(function(dimension, filter){
                        angular.element("#last-modification-chart-reset").css("visibility","visible");
                        scope.chart.focus(scope.zoomChart.filter());
                        scope.chart.filterAll();
                        return filter;
                    });

                    scope.zoomChart.xAxis().tickFormat(scope.locale.multi([
                        ["", function(d) { return d.getMilliseconds(); }],
                        ["", function(d) { return d.getSeconds(); }],
                        ["", function(d) { return d.getMinutes(); }],
                        ["", function(d) { return d.getHours(); }],
                        ["", function(d) { return d.getDay() && d.getDate() != 1; }],
                        ["", function(d) { return d.getDate() != 1; }],
                        ["", function(d) { return d.getMonth(); }],
                        ["%Y", function() { return true; }]
                    ]));
                }

                scope.chart = dc.barChart('#last-modification-chart');
                scope.chart
                    .width(scope.chartWidth)
                    .height(scope.chartHeight)
                    .margins({top: 5, right: 10, bottom: 37, left: 30})
                    .dimension(scope.dimLastMod)
                    .group(scope.groupLastMod)
                    //.elasticY(true)
                    .centerBar(true)
                    .gap(3)
                    .transitionDuration(1000)
                    .x(d3.time.scale().domain([scope.first, scope.last]))
                    .y(d3.scale.sqrt().exponent(0.7).domain([0,scope.maxYValue]))
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .yAxis().ticks(5).tickFormat(d3.format('d'));

                //fix for german language in x axis
                scope.chart.xAxis().tickFormat(scope.tickFormat);

                scope.chart.on("filtered", function(chart, filter){
                    angular.element("#last-modification-chart-reset").css("visibility","visible");
                    scope.debounceTriggerUpdate();
                });

                dc.renderAll();

                if (scope.showZoomChart){
                    scope.zoomChart.filter([scope.zoomFirst,scope.last]);
                    angular.element("#last-modification-chart-reset").css("visibility","hidden");
                }
            };


            scope.$on('filterChanged', function() {
                scope.calculateMaxY();
                scope.adjustYAxes();
            });

            scope.reset = function(){
                if (scope.showZoomChart){
                    scope.zoomChart.filterAll();
                    scope.zoomChart.filter([scope.zoomFirst,scope.last]);
                    scope.calculateMaxY();
                    scope.adjustYAxes();
                }
                scope.chart.filterAll();
                angular.element("#last-modification-chart-reset").css("visibility","hidden");
                MetadataService.triggerUpdate();
            };


            scope.$on('globalreset', function() {
                scope.reset();
            });


            scope.calculateMaxY = function () {
                scope.maxYValue = 0;
                if (scope.zoomChart != undefined && scope.zoomChart.filter() != null){
                    var filter = scope.zoomChart.filter();
                    scope.groupLastMod.all().forEach(function(entry) {
                        if (entry.value > scope.maxYValue){
                            if (filter[0] <= entry.key && entry.key <= filter[1]){
                                scope.maxYValue = entry.value;
                            }
                        }
                    });
                }
                else{
                    scope.groupLastMod.all().forEach(function(entry) {
                        if (entry.value > scope.maxYValue){
                            scope.maxYValue = entry.value;
                        }
                    });
                }
                if (scope.maxYValue < scope.minYAxisHeight){
                    scope.maxYValue = scope.minYAxisHeight;
                }
            };

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