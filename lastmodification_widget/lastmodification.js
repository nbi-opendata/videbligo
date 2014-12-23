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

                scope.debounceTriggerUpdate = debounce(function () {
                    MetadataService.triggerUpdate(this);
                }, 250);

                var chart = dc.barChart('#last-modification-chart');
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

                chart.on("filtered", function(chart, filter){
                    console.log("debouncing");
                    scope.debounceTriggerUpdate();
                });

                chart.render();
            }


            scope.$on('filterChanged', function() {
            });


            MetadataService.registerWidget(scope.init);
        }
    };
}]);

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
