Videbligo.directive('lastmodification', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'lastmodification_widget/lastmodification.html',
        scope: {},
        link: function(scope, element, attrs) {

            //used to determine x axes domain for both charts
            scope.formatter = d3.time.week;

            //which language should the months on the x-axis be in
            //alternatively, for english, use 'd3.time.format'
            scope.locale = germanLocale.timeFormat;

            //params injected from index.html
            scope.chartWidth = 500;
            scope.chartHeight = 170;
            scope.showZoomChart = true;

            scope.groupLastMod = {};
            scope.dimLastMod = {};

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
                        .y(d3.scale.sqrt().exponent(0.3).domain([0,400]))
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
                    .margins({top: 5, right: 10, bottom: 35, left: 30})
                    .dimension(scope.dimLastMod)
                    .group(scope.groupLastMod)
                    //.elasticY(true)
                    .centerBar(true)
                    .gap(3)
                    .transitionDuration(1000)
                    .x(d3.time.scale().domain([scope.first, scope.last]))
                    .y(d3.scale.sqrt().exponent(0.7).domain([0,250]))
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .yAxis().tickFormat(d3.format('d'));

                //fix for german language in x axis
                scope.chart.xAxis().tickFormat(scope.tickFormat);

                scope.chart.on("filtered", function(chart, filter){
                    angular.element("#last-modification-chart-reset").css("visibility","visible");
                    scope.debounceTriggerUpdate();
                });

                dc.renderAll();

                if (scope.showZoomChart){
                    scope.zoomChart.filter([new Date("01/01/2014"),scope.last]);
                }
            };


            scope.$on('filterChanged', function() {
                dc.redrawAll();
            });

            scope.reset = function(){
                scope.zoomChart.filterAll();
                scope.chart.focus([scope.first,scope.last]);
                scope.chart.filterAll();
                dc.redrawAll();
                angular.element("#last-modification-chart-reset").css("visibility","hidden");
            };


            MetadataService.registerWidget(scope.init);
        }
    };
}]);