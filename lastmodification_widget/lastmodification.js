Videbligo.directive('lastmodification', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'lastmodification_widget/lastmodification.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.formatter = d3.time.month;

            scope.chartWidth = 600;

            scope.groupLastMod = {};
            scope.dimLastMod = {};

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.dimLastMod = scope.data.dimension(function(d){
                    var date = scope.formatter(new Date(d.metadata_modified));
                    return date;
                });

                scope.groupLastMod = scope.dimLastMod.group();
                var last = new Date(scope.dimLastMod.top(1)[0].metadata_modified);
                var first = new Date(scope.dimLastMod.bottom(1)[0].metadata_modified);

                scope.debounceTriggerUpdate = debounce(function () {
                    MetadataService.triggerUpdate(this);
                }, 250);

                scope.zoomChart = dc.barChart('#last-modification-zoom-chart');
                scope.zoomChart
                    .width(scope.chartWidth)
                    .height(40)
                    .margins({top: 0, right: 20, bottom: 18, left: 30})
                    .dimension(scope.dimLastMod)
                    .group(scope.groupLastMod)
                    .centerBar(true)
                    .gap(1)
                    .x(d3.time.scale().domain([first, last]))
                    .y(d3.scale.sqrt().exponent(0.3).domain([0,400]))
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .yAxis().tickValues([]);

                scope.zoomChart.filterHandler(function(dimension, filter){
                    console.log("zoom filtered "+filter);
                    scope.chart.focus(scope.zoomChart.filter());
                    scope.chart.filterAll();
                    return filter;
                });

                scope.chart = dc.barChart('#last-modification-chart');
                scope.chart
                    .width(scope.chartWidth)
                    .height(200)
                    .margins({top: 10, right: 20, bottom: 18, left: 30})
                    .dimension(scope.dimLastMod)
                    .group(scope.groupLastMod)
                    //.rangeChart(scope.zoomChart)
                    //.elasticY(true)
                    .centerBar(true)
                    .gap(1)
                    .transitionDuration(1000)
                    .x(d3.time.scale().domain([first, last]))
                    .y(d3.scale.sqrt().exponent(0.7).domain([0,250]))
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .yAxis().tickFormat(d3.format('d'));

                scope.chart.on("filtered", function(chart, filter){
                    scope.debounceTriggerUpdate();
                });

                dc.renderAll();

                scope.zoomChart.filter([new Date("01/01/2014"),last]);
            }


            scope.$on('filterChanged', function() {
                dc.redrawAll();
            });


            MetadataService.registerWidget(scope.init);
        }
    };
}]);