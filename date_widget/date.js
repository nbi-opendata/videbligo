Videbligo.directive('date', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'date_widget/date.html',
        scope: {},
        link: function(scope, element, attrs) {

            //scope.available_from = "";
            //scope.available_to = "";
            //scope.earliest = {};
            //scope.latest = {};
            scope.span_visible = false;
            scope.timeChart = {};
            scope.dateGroup = {};
            scope.dimDate = {};
            scope.selectedYears = new StringSet();
            scope.svgParams = {};

            scope.init = function(){
                scope.data = MetadataService.getData();

                scope.dimDate = scope.data.dimension(function(d){
                    var dateFrom = parseDate(d.extras["temporal_coverage-from"]);
                    var dateTo = parseDate(d.extras["temporal_coverage-to"]);
                    return {from: dateFrom, to: dateTo};
                });

                //scope.dimDateFrom = scope.data.dimension(function(d){return parseDate(d.extras["temporal_coverage-from"]);});
                //
                //scope.dimDateTo = scope.data.dimension(function(d){return parseDate(d.extras["temporal_coverage-to"]);});
                ////scope.earliest = scope.dimDateFrom.bottom(Infinity)
                ////    .filter(function(d){return d.extras["temporal_coverage-from"] != undefined && d != ""; })
                ////    [0].extras["temporal_coverage-from"];
                ////scope.latest = scope.dimDate.top(Infinity)
                ////    .filter(function(d){return d.extras["temporal_coverage-to"] != undefined && d != "";})
                ////    [0].extras["temporal_coverage-to"];

                scope.dateGroup = scope.dimDate.group().reduce(
                    //add
                    function (p,v){
                        var from = v.extras["temporal_coverage-from"];
                        var to = v.extras["temporal_coverage-to"];
                        var fromDate = {}
                        var toDate = to == undefined ? new Date() : parseDate(to);

                        if (from != undefined){
                            for (var i = parseDate(from).getFullYear(); i <= toDate.getFullYear(); i++){
                                if (i in p.years){
                                    p.years[i]++;
                                }
                                else {
                                    p.years[i] = 1;
                                }
                            }
                        }
                        return p;
                    },
                    //remove
                    function (p,v) {
                        var from = v.extras["temporal_coverage-from"];
                        var to = v.extras["temporal_coverage-to"];
                        var fromDate = {}
                        var toDate = to == undefined ? new Date() : parseDate(to);

                        if (from != undefined){
                            for (var i = parseDate(from).getFullYear(); i <= toDate.getFullYear(); i++){
                                p.years[i]--;
                                if (p.years[i] === 0){
                                    delete p.years[i];
                                }
                            }
                        }
                        return p;
                    },
                    //initial
                    function (){
                        return {
                            years: {}
                        };
                    }
                );

                scope.initSvg();
            }

            scope.initSvg = function(){
                scope.updateCurrentMappings();

                scope.svgParams.margin = {top: 20, right: 20, bottom: 30, left: 40},
                    scope.svgParams.width = 500,
                    scope.svgParams.height = 300;

                scope.svgParams.x = d3.scale.ordinal().rangeRoundBands([0, scope.svgParams.width], .1);

                scope.svgParams.y = d3.scale.linear().range([scope.svgParams.height, 0]);


                scope.svgParams.x.domain(scope.svgParams.currentMappings.map(function(d) { return d.year; }));
                scope.svgParams.y.domain([0, d3.max(scope.svgParams.currentMappings, function(d) { return d.value; })]);

                scope.svgParams.xAxis = d3.svg.axis()
                    .scale(scope.svgParams.x)
                    .orient("bottom");

                scope.svgParams.yAxis = d3.svg.axis()
                    .scale(scope.svgParams.y)
                    .orient("left")
                    .tickFormat(d3.format("d"));


                scope.svg = d3.select("#time-chart").append("svg")
                    .attr("width", scope.svgParams.width + scope.svgParams.margin.left + scope.svgParams.margin.right)
                    .attr("height", scope.svgParams.height + scope.svgParams.margin.top + scope.svgParams.margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + scope.svgParams.margin.left + "," + scope.svgParams.margin.top + ")");

                scope.svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + scope.svgParams.height + ")")
                    .call(scope.svgParams.xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em")
                    .attr("transform", function(d){return "rotate(-80)"});

                scope.svg.append("g")
                    .attr("class", "y axis")
                    .call(scope.svgParams.yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Anzahl der Datensätze");
            }

            scope.toggle = function(year) {
                if(scope.selectedYears.contains(year)) {
                    scope.selectedYears.remove(year);
                }
                else {
                    scope.selectedYears.add(year);
                }

                if (scope.selectedYears.values().length == 0){
                    $("#time-chart-reset").css("visibility","hidden");
                    scope.dimDate.filterAll();
                }
                else{
                    $("#time-chart-reset").css("visibility","visible");
                    scope.dimDate.filter(scope.filterFunction);
                }

                MetadataService.triggerUpdate();
            }

            scope.filterFunction = function(d){
                var result = false;
                var years = scope.selectedYears.values();
                for (var index in years) {
                    var year = years[index];
                    if (d.from != undefined && d.to != undefined){
                        result = result || (d.from.getFullYear() <= year && year <= d.to.getFullYear());
                    }
                    else if (d.from != undefined){
                        result = result || (d.from.getFullYear() <= year);
                    }
                    else if (d.to != undefined){
                        result = result || (year <= d.to.getFullYear());
                    }
                }
                return result;
            }

            scope.$on('filterChanged', function() {
                scope.updateChart();

                scope.span_visible = MetadataService.length() > 0;
                if(scope.span_visible){//only do this if there are values to extract
                    //scope.available_from = scope.dimDateFrom.bottom(Infinity)
                    //    .filter(function(d){return d.extras["temporal_coverage-from"] != undefined && d != ""; })
                    //    [0].extras["temporal_coverage-from"];
                    //scope.available_to = scope.dimDateTo.top(Infinity)
                    //    .filter(function(d){return d.extras["temporal_coverage-to"] != undefined && d != "";})
                    //    [0].extras["temporal_coverage-to"];
                }
            });

            scope.updateChart = function() {
                scope.updateCurrentMappings();

                scope.svg.selectAll(".bar").remove();

                scope.svgParams.x.domain(scope.svgParams.initialYears);
                scope.svgParams.y.domain([0, d3.max(scope.svgParams.currentMappings, function(d) { return d.value; })]);

                scope.svgParams.xAxis = d3.svg.axis()
                    .scale(scope.svgParams.x)
                    .orient("bottom");

                scope.svgParams.yAxis = d3.svg.axis()
                    .scale(scope.svgParams.y)
                    .tickFormat(d3.format("d"))
                    .orient("left");

                scope.svg.select("g .x.axis")
                    .call(scope.svgParams.xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em");

                scope.svg.select("g .y.axis")
                    .call(scope.svgParams.yAxis);

                scope.svg.selectAll(".bar")
                    .data(scope.svgParams.currentMappings)
                    .enter()
                    .append("rect")
                    .attr("x", function(d) { return scope.svgParams.x(d.year); })
                    .attr("width", scope.svgParams.x.rangeBand())
                    .attr("y", function(d) { return scope.svgParams.y(d.value); })
                    .attr("height", function(d) { return scope.svgParams.height - scope.svgParams.y(d.value); })
                    .attr("id", function(d){ return "time-coverage-bar-"+ d.year;})
                    .attr("ng-click", function(d){ return "toggle("+ d.year+")";})
                    .attr("ng-class", function(d){ return "{'bar': true, 'active': selectedYears.contains("+ d.year+")}";});

                $compile(angular.element('#time-chart'))(scope);
            }

            scope.updateCurrentMappings = function(){
                var yearsAndNumbers = scope.dateGroup.top(1)[0].value.years;
                var years = Object.keys(yearsAndNumbers);
                var values = years.map(function (key) {
                    return yearsAndNumbers[key];
                });

                scope.svgParams.currentMappings = [];
                for (var index in years){
                    scope.svgParams.currentMappings.push({year:years[index], value:yearsAndNumbers[years[index]]});
                }

                if (!scope.svgParams.initialYears){
                    scope.svgParams.initialYears = years;
                }
            }

            scope.resetSelection = function () {
                $("#time-chart-reset").css("visibility","hidden");
                scope.selectedYears.clear();
                scope.dimDate.filterAll();
                MetadataService.triggerUpdate();
            }

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
