Videbligo.directive('date', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'date_widget/date.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.availableFrom = "";
            scope.availableTo = "";
            scope.spanVisible = false;
            scope.groupDate = {};
            scope.dimDate = {};

            scope.getD3TimeRange = function(data){
                var formatter = d3.time.year;
                var dateFrom = parseDate(data.extras["temporal_coverage-from"]);

                if (dateFrom != undefined){
                    dateFrom = formatter.floor(dateFrom);
                }

                var dateTo = parseDate(data.extras["temporal_coverage-to"]);
                if (dateTo != undefined){
                    dateTo = formatter.ceil(dateTo);
                }

                return formatter.range(dateFrom, dateTo);
            };


            scope.init = function(){
                var data = MetadataService.getData();

                scope.dimDate = data.dimension(function(d){
                    return scope.getD3TimeRange(d).map(function (date) {
                        return date.getFullYear();
                    });
                });

                scope.groupDate = scope.dimDate.groupAll().reduce(
                    function (p,v){
                        scope.getD3TimeRange(v).forEach (function(val, idx) {
                            val = val.getFullYear();
                            p[val] = (p[val] || 0) + 1; //increment counts
                        });
                        return p;
                    },
                    function (p,v) {
                        scope.getD3TimeRange(v).forEach (function(val, idx) {
                            val = val.getFullYear();
                            p[val] = (p[val] || 0) - 1; //increment counts
                        });
                        return p;
                    },
                    function (){
                        return {};
                    }
                );

                //adding functions to simulate the group of crossfilter
                scope.groupDate.all = function() {
                    var newObject = [];
                    var self = this.value();
                    for (var key in self) {
                        if (self.hasOwnProperty(key) && key != "all") {
                            newObject.push({
                                               key: key,
                                               value: self[key]
                                           });
                        }
                    }

                    return newObject;
                };

                scope.groupDate.size = function(){return this.all().length;};

                scope.initSvg();
            }


            scope.initSvg = function(){
                scope.debounceTriggerUpdate = debounce(function (chart, filter) {
                    MetadataService.triggerUpdate(this);
                }, 250);

                var first = parseInt(scope.groupDate.all()[0].key);
                var length = scope.groupDate.size();
                var last = parseInt(scope.groupDate.all()[length -1].key);

                var chart = dc.barChart('#time-chart');
                scope.chart = chart;
                chart
                    .width(1000)
                    .height(200)
                    .dimension(scope.dimDate)
                    .group(scope.groupDate)
                    .x(d3.scale.linear().domain([first, last]))
                    //.elasticX(true)
                    .elasticY(true);

                chart.render();
            }

            scope.$on('filterChanged', function() {
                scope.chart.redraw();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
