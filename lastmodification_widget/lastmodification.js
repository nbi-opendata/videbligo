Videbligo.directive('lastmodification', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'lastmodification_widget/lastmodification.html',
        scope: {},
        link: function(scope, element, attrs) {

            //used to determine x axes domain for both charts
            scope.formatter = d3.time.month;

            //which language should the months on the x-axis be in
            //alternatively, use englishDateFormatter
            scope.localizationFormatter = germanDateFormatter;

            //%b indicates that the month names should be abbreviated.
            //Use %B for full names.
            scope.monthFormat = "%b";

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

                var data = MetadataService.getData();
                scope.dimLastMod = data.dimension(function(d){
                    return scope.formatter(new Date(d.metadata_modified));
                });

                scope.groupLastMod = scope.dimLastMod.group();
                var last = new Date(scope.dimLastMod.top(1)[0].metadata_modified);
                var first = new Date(scope.dimLastMod.bottom(1)[0].metadata_modified);

                scope.debounceTriggerUpdate = debounce(function () {
                    MetadataService.triggerUpdate(this);
                }, 250);

                if (scope.showZoomChart){
                    scope.zoomChart = dc.barChart('#last-modification-zoom-chart');
                    scope.zoomChart
                        .width(scope.chartWidth)
                        .height(35)
                        .margins({top: 0, right: 20, bottom: 18, left: 30})
                        .dimension(scope.dimLastMod)
                        .group(scope.groupLastMod)
                        .centerBar(true)
                        .gap(1)
                        .x(d3.time.scale().domain([first, last]))
                        .y(d3.scale.sqrt().exponent(0.3).domain([0,400]))
                        .round(scope.formatter.round)
                        .xUnits(scope.formatter.range);

                    scope.zoomChart.filterHandler(function(dimension, filter){
                        scope.chart.focus(scope.zoomChart.filter());
                        scope.chart.filterAll();
                        return filter;
                    });
                    scope.zoomChart
                        .xAxis().tickFormat(function(d){return scope.localizationFormatter(d, scope.monthFormat)});
                }

                scope.chart = dc.barChart('#last-modification-chart');
                scope.chart
                    .width(scope.chartWidth)
                    .height(scope.chartHeight)
                    .margins({top: 10, right: 20, bottom: 18, left: 30})
                    .dimension(scope.dimLastMod)
                    .group(scope.groupLastMod)
                    //.elasticY(true)
                    .centerBar(true)
                    .gap(1)
                    .transitionDuration(1000)
                    .x(d3.time.scale().domain([first, last]))
                    .y(d3.scale.sqrt().exponent(0.7).domain([0,250]))
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .yAxis().tickFormat(d3.format('d'));

                //fix for german language in x axis
                scope.chart.xAxis().tickFormat(function(d){return scope.localizationFormatter(d, scope.monthFormat)});

                scope.chart.on("filtered", function(chart, filter){
                    scope.debounceTriggerUpdate();
                });

                dc.renderAll();

                if (scope.showZoomChart){
                    scope.zoomChart.filter([new Date("01/01/2014"),last]);
                }
            };


            scope.$on('filterChanged', function() {
                dc.redrawAll();
            });


            MetadataService.registerWidget(scope.init);
        }
    };
}]);