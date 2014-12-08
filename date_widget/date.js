Videbligo.directive('date', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'date_widget/date.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.available_from = "";
            scope.available_to = "";
            //scope.earliest = {};
            //scope.latest = {};
            scope.span_visible = false;
            scope.date = undefined;
            scope.timeChart = {};
            scope.dateGroup = {};
            scope.dimDate = {};
            scope.selectedYears = [];
            scope.svgParams = {};

            scope.init = function(){
                scope.data = MetadataService.getData();

                scope.dimDate = scope.data.dimension(function(d){
                    var dateFrom = parseDate(d.extras["temporal_coverage-from"]);
                    //dateFrom = dateFrom == undefined ? parseDate("1900-01-01") : dateFrom;
                    var dateTo = parseDate(d.extras["temporal_coverage-to"]);
                    //dateTo = dateTo == undefined ? parseDate("2900-01-01") : dateTo;
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

                //console.log(scope.earliest);
                //console.log(scope.latest);


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

                var yearsAndNumbers = scope.dateGroup.top(1)[0].value.years;
                var years = Object.keys(yearsAndNumbers);
                var values = years.map(function (key) {
                    return yearsAndNumbers[key];
                });

                var mappings = [];
                for (var index in years){
                    mappings.push({year:years[index], value:yearsAndNumbers[years[index]]});
                }

                scope.svgParams.initialYears = years;
                scope.svgParams.initialValues = values;

                scope.svgParams.margin = {top: 20, right: 20, bottom: 30, left: 40},
                    scope.svgParams.width = 500,
                    scope.svgParams.height = 300;

                scope.svg = d3.select("#time-chart").append("svg")
                    .attr("width", scope.svgParams.width + scope.svgParams.margin.left + scope.svgParams.margin.right)
                    .attr("height", scope.svgParams.height + scope.svgParams.margin.top + scope.svgParams.margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + scope.svgParams.margin.left + "," + scope.svgParams.margin.top + ")");


                scope.svgParams.x = d3.scale.ordinal()
                    .rangeRoundBands([0, scope.svgParams.width], .1);

                scope.svgParams.y = d3.scale.linear()
                    .range([scope.svgParams.height, 0]);


                scope.svgParams.x.domain(mappings.map(function(d) { return d.year; }));
                scope.svgParams.y.domain([0, d3.max(mappings, function(d) { return d.value; })]);

                scope.svgParams.xAxis = d3.svg.axis()
                    .scale(scope.svgParams.x)
                    .orient("bottom");

                scope.svgParams.yAxis = d3.svg.axis()
                    .scale(scope.svgParams.y)
                    .orient("left");

                scope.svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + scope.svgParams.height + ")")
                    .call(scope.svgParams.xAxis).selectAll("text")
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

            scope.dateChanged = function() {
                MetadataService.triggerUpdate();
            }

            scope.$on('filterChanged', function() {
                console.log(scope.selectedYears);

                if (scope.selectedYears.length == 0){
                    scope.dimDate.filterAll();
                }
                else{
                    scope.dimDate.filter(function(d){
                        var result = false;

                        for (var index in scope.selectedYears) {
                            var year = scope.selectedYears[index];

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
                    });
                }

                //console.log("Anzahl: " +scope.dimDate.top(Infinity).length);
                var yearsAndNumbers = scope.dateGroup.top(1)[0].value.years;

                var years = Object.keys(yearsAndNumbers);
                var values = years.map(function (key) {
                    return yearsAndNumbers[key];
                });

                var mappings = [];
                for (var index in years){
                    mappings.push({year:years[index], value:yearsAndNumbers[years[index]]});
                }

                scope.svg.selectAll(".bar").remove();

                scope.svgParams.x.domain(scope.svgParams.initialYears);
                scope.svgParams.y.domain([0, d3.max(mappings, function(d) { return d.value; })]);

                scope.svgParams.xAxis = d3.svg.axis()
                    .scale(scope.svgParams.x)
                    .orient("bottom");

                scope.svgParams.yAxis = d3.svg.axis()
                    .scale(scope.svgParams.y)
                    .orient("left");

                scope.svg.select("g .x.axis")
                    .call(scope.svgParams.xAxis)
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em")
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em")
                    .attr("transform", function(d){return "rotate(-80)"});;

                scope.svg.select("g .y.axis")
                    .call(scope.svgParams.yAxis);

                scope.svg.selectAll(".bar")
                    .data(mappings)
                    .enter().append("rect")
                    .attr("x", function(d) { return scope.svgParams.x(d.year); })
                    .attr("width", scope.svgParams.x.rangeBand())
                    .attr("y", function(d) { return scope.svgParams.y(d.value); })
                    .attr("height", function(d) { return scope.svgParams.height - scope.svgParams.y(d.value); })
                    .attr("class", function(d){
                        var c = "bar";
                        if (scope.selectedYears.indexOf(d.year) != -1){
                            c += " active";
                        }
                        return c;
                    })
                    .on("click", function(d) {
                        if(scope.selectedYears.indexOf(d.year) == -1) { scope.selectedYears.push(d.year); }
                        else { scope.selectedYears.splice(scope.selectedYears.indexOf(d.year), 1); }
                        scope.svg.selectAll(".bar").attr("class", function(d){
                            var c = "bar";
                            if (scope.selectedYears.indexOf(d.year) != -1){
                                c += " active";
                            }
                            return c;
                        })
                        scope.dateChanged();
                    });
                    //.attr("ng-click", "scope.dateChanged()")
                    //.attr("ng-class", function(d) { return "{'active': selectedYears.contains("+d.numberOfData+")}"; })

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

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
