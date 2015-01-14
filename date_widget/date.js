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

            scope.extractGroupData = function(d){
                var groupValues = [];
                d = d[0].value;
                for(var key in d){
                    var v = {
                        'key': parseInt(key),
                        'value': d[key]
                    }
                    groupValues.push(v)
                }
                return groupValues;
            }

            scope.groupWrapper = {
                'all': function(){return scope.extractGroupData(scope.groupDate.all());},
                'top': function(n){return scope.extractGroupData(scope.groupDate.all());},
                'size': function(){return scope.extractGroupData(scope.groupDate.all()).length;}
            }

            scope.accessLeft = function(d) {
                return d.extras["temporal_coverage-from"];
            }

            scope.accessRight = function(d){
                return d.extras["temporal_coverage-to"];
            }
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
                    return scope.getD3TimeRange(d);
                });

                scope.dimDateFrom = data.dimension(function(d){
                    return parseDate(scope.accessLeft(d));
                });

                scope.dimDateTo = data.dimension(function(d){
                    return parseDate(scope.accessRight(d));
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
                );



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

                    newObject.sort(function(a,b){
                        return new Date(a.key) - new Date(b.key);
                    });

                    return newObject;
                };

                scope.groupDate.size = function(){return this.all().length;};
                scope.groupDate.top = function(n){console.log('top'); return this.all()};

                scope.initSvg();
                //var z = x.filter(function(d){return d.map(function(d){return d.getFullYear();}).indexOf(parseDate('2014-01-02').getFullYear()) > -1;})
            }


            scope.initSvg = function(){
                scope.debounceTriggerUpdate = debounce(function (chart, filter) {
                    MetadataService.triggerUpdate(this);
                }, 250);

                var dates = Object.keys(scope.groupDate).map(function(d){
                    return new Date(d);
                }).sort(function(a,b){
                    return new Date(a) - new Date(b);
                });



                var first = dates[0];
                var length = dates.length;
                var last = dates[length-1];

                //scope.chart = dc.barChart('#time-chart');
                //var chart = scope.chart;
                //chart.width(600)
                //    .height(200)
                //    .margins({top: 0, right: 50, bottom: 20, left: 40})
                //    .dimension(scope.dimDate)
                //    .group(scope.groupDate)
                //
                //    .xUnits(d3.time.years)
                //    .gap(1)
                //    //.round(dc.round.floor)
                //    .transitionDuration(1000)
                //    .x(d3.time.scale().domain([first, last]));
                ////chart.xAxis().tickFormat(function (v) {return v;});


                var chart = dc.barChart('#time-chart');
                scope.chart = chart;
                chart
                    .width(1000)
                    .height(200)
                    //.renderLabel(true)
                    .dimension(scope.dimDate)
                    .group(scope.groupDate)
                    .x(d3.time.scale().domain([first, last]))
                    .xAxis().ticks(3);
                chart.round(d3.time.year);


                chart.on("filtered", function(chart, filter){
                    scope.debounceTriggerUpdate(chart, filter);
                });

                chart.filterHandler(function(dimension, filter){
                    console.log(filter);
                    //dimension.filter(function(d){
                    //    return d.map(function(d){return d.getFullYear();})
                    //            .indexOf(filter.getFullYear()) > -1;
                    //});
                    return filter;
                });

                chart.render();
            }



            scope.$on('filterChanged', function() {
                scope.chart.redraw();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
