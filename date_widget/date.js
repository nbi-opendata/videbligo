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
            scope.formatter = d3.time.year;

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
                var data = MetadataService.getData();

                scope.dimDate = data.dimension(function(d){
                    return scope.getD3TimeRange(d);
                });

                scope.groupDate = scope.dimDate.groupAll().reduce(
                    function (p,v){
                        scope.getD3TimeRange(v).forEach (function(val, idx) {
                            p[val] = (p[val] || 0) + 1; //increment counts
                        });
                        return p;
                    },
                    function (p,v) {
                        scope.getD3TimeRange(v).forEach (function(val, idx) {
                            p[val] = (p[val] || 0) - 1; //increment counts
                        });
                        return p;
                    },
                    function (){
                        return {};
                    }
                ).value();

                //adding functions to simulate the group of crossfilter
                scope.groupDate.all = function() {
                    var newObject = [];
                    for (var key in this) {
                        if (this.hasOwnProperty(key) && key != "all") {
                            binaryInsert({key: new Date(key), value: this[key]}, newObject);
                        }
                    }

                    return newObject;
                };

                scope.initSvg();
            };


            scope.initSvg = function(){
                scope.debounceTriggerUpdate = debounce(function (chart, filter) {
                    MetadataService.triggerUpdate(this);
                }, 250);

                var all = scope.groupDate.all();
                var first = all[0].key;
                var last = all[all.length-1].key;
                var chart = dc.barChart('#time-chart');
                scope.chart = chart;
                chart
                    .width(1000)
                    .height(200)
                    .margins({top: 10, right: 10, bottom: 20, left: 30})
                    .dimension(scope.dimDate)
                    .group(scope.groupDate)
                    .x(d3.time.scale().domain([first, last]))
                    .elasticY(true)
                    .round(scope.formatter.round)
                    .xUnits(scope.formatter.range)
                    .yAxis().tickFormat(d3.format("d"));

                chart.filterHandler(function(dimension, filter){
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

                        //console.log(dimension.top(Infinity).length);
                    }
                    else {
                        dimension.filterAll();
                    }

                    return filter;
                });

                //chart.on("filtered", function(chart, filter){
                //    scope.debounceTriggerUpdate();
                //    console.log(filter);
                //});

                chart.render();
            };

            function binaryInsert(value, array, startVal, endVal){
                var length = array.length;
                var start = typeof(startVal) != 'undefined' ? startVal : 0;
                var end = typeof(endVal) != 'undefined' ? endVal : length - 1;
                var m = start + Math.floor((end - start)/2);

                if(length == 0){
                    array.push(value);
                    return;
                }

                if(value.key.getTime() > array[end].key.getTime()){
                    array.splice(end + 1, 0, value);
                    return;
                }

                if(value.key.getTime() < array[start].key.getTime()){
                    array.splice(start, 0, value);
                    return;
                }

                if(start >= end){
                    return;
                }

                if(value.key.getTime() < array[m].key.getTime()){
                    binaryInsert(value, array, start, m - 1);
                    return;
                }

                if(value.key.getTime() > array[m].key.getTime()){
                    binaryInsert(value, array, m + 1, end);
                    return;
                }
            }

            scope.$on('filterChanged', function() {
                scope.chart.redraw();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
