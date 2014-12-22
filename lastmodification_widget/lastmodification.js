Videbligo.directive('lastmodification', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'lastmodification_widget/lastmodification.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.groupLastMod = {};
            scope.dimLastMod = {};
            scope.triggerInProgress = false;

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.dimLastMod = scope.data.dimension(function(d){
                    var date = d3.time.month(new Date(d.metadata_modified));
                    return date;
                });

                scope.groupLastMod = scope.dimLastMod.group();
                var last = new Date(scope.dimLastMod.top(1)[0].metadata_modified);
                var first = new Date(scope.dimLastMod.bottom(1)[0].metadata_modified);

                dc.constants.EVENT_DELAY = 100;

                var chart = dc.barChart('#last-modification-chart');

                var yMax = d3.max(scope.groupLastMod.all(), function(d) { return d.value; });
                chart.width(600)
                    .height(200)
                    .margins({top: 0, right: 50, bottom: 20, left: 40})
                    .dimension(scope.dimLastMod)
                    .group(scope.groupLastMod)
                    .elasticY(true)
                    .centerBar(true)
                    .gap(1)
                    .transitionDuration(1000)
                    .x(d3.time.scale().domain([first, last]))
                    .round(d3.time.month.round)
                    .xUnits(d3.time.months);

                chart.on("filtered", function(chart, filter){//SUPER MEGA HACKY, besserer weg muss her
                    //if(!scope.triggerInProgress){
                    //    scope.triggerInProgress = true;
                    //    setTimeout(function(){
                    //        scope.triggerInProgress = false;
                    //    }, 1000);
                    //}
                    //console.log('whoooop whooop');
                    //console.log(filter);
                    //MetadataService.triggerUpdate();
                });

                chart.render();
                scope.chart = chart;


                scope.lastModMouseUp = function() {
                    console.log('mouseup');
                    MetadataService.triggerUpdate();
                };

            }


            scope.$on('filterChanged', function() {
                scope.chart.render();
            });


            MetadataService.registerWidget(scope.init);
        }
    };
}]);
