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

            scope.init = function(){
                var data = MetadataService.getData();

                scope.dimDate = data.dimension(function(d){
                    var dateFrom = parseDate(d.extras["temporal_coverage-from"]);
                    var dateTo = parseDate(d.extras["temporal_coverage-to"]);
                    return {from: dateFrom, to: dateTo};
                });

                scope.dimDateFrom = data.dimension(function(d){
                    return parseDate(scope.accessLeft(d));
                });

                scope.dimDateTo = data.dimension(function(d){
                    return parseDate(scope.accessRight(d));
                });

                scope.groupDate = scope.dimDate.group().reduce(
                    function (p,v){
                        var from = v.extras["temporal_coverage-from"];
                        var to = v.extras["temporal_coverage-to"];
                        //console.log("p: " + JSON.stringify(p));
                        if(from == undefined || to == undefined)
                            return p;
                        var toDate = parseDate(to);
                        var fromDate = parseDate(from);
                        if (from != undefined){
                            for (var i = fromDate.getFullYear(); i <= toDate.getFullYear(); i++){
                                if (i in p){
                                    p[i]++;
                                }
                                else {
                                    p[i] = 1;
                                }
                            }
                        }
                        return p;
                    },
                    function (p,v) {
                        var from = v.extras["temporal_coverage-from"];
                        var to = v.extras["temporal_coverage-to"];
                        var fromDate = {}
                        var toDate = parseDate(to);
                        if(from == undefined || to == undefined)
                            return p;
                        if (from != undefined){
                            for (var i = parseDate(from).getFullYear(); i <= toDate.getFullYear(); i++){
                                p[i]--;
                                if (p[i] === 0){
                                    delete p[i];
                                }
                            }
                        }
                        return p;
                    },
                    function (){
                        return [];
                    }
                );

                scope.extractGroupData(scope.groupDate.all());

                scope.initSvg();
            }

            scope.initSvg = function(){
                scope.debounceTriggerUpdate = debounce(function (chart, filter) {
                    MetadataService.triggerUpdate(this);
                }, 250);

                var first = scope.groupWrapper.all()[0].key;
                var length = scope.groupWrapper.size();
                var last = scope.groupWrapper.all()[length-1].key;

                scope.chart = dc.barChart('#time-chart');
                var chart = scope.chart;
                chart.width(600)
                    .height(200)
                    .margins({top: 0, right: 50, bottom: 20, left: 40})
                    .dimension(scope.dimDate)
                    .group(scope.groupWrapper)
                    .elasticX(true)
                    .elasticY(true)
                    .gap(1)
                    .round(dc.round.floor)
                    .transitionDuration(1000)
                    .x(d3.scale.linear().domain([first, last]));
                //so the x axis has no limiter in the years
                chart.xAxis().tickFormat(function (v) {return v;});

                chart.on("filtered", function(chart, filter){
                    scope.debounceTriggerUpdate(chart, filter);
                });

                chart.filterHandler(function(dimension, filter){
                    //dimension.filter(function(d) {
                    //    var left = filter[0];
                    //    var right = filter[1];
                    //    var dleft = parseDate(scope.accessLeft(d)).getFullYear();
                    //    var dright = parseDate(scope.accessRight(d)).getFullYear();
                    //    if(dright < left)
                    //        return false;
                    //    if(right < dleft)
                    //        return false;
                    //    return true;
                    //});
                    return filter;
                });

                chart.render();
            }



            scope.$on('filterChanged', function() {
                //var first = scope.groupWrapper.all()[0].key;
                //var length = scope.groupWrapper.size();
                //var last = scope.groupWrapper.all()[length-1].key;

                //scope.chart.x(d3.scale.linear().domain([first, last]));
                scope.chart.redraw();
                scope.chart.redrawBrush();
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
