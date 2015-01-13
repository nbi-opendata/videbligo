Videbligo.directive('date', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'date_widget/date.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.availableFrom = "";
            scope.availableTo = "";
            scope.spanVisible = false;
            scope.dateGroup = {};
            scope.dimDate = {};
            scope.selectedYears = new StringSet();
            scope.svgParams = {};
            scope.hover = {};
            scope.selectionType = {
                ADD: {},
                REMOVE: {}
            };
            scope.brushParams = {};

            scope.init = function(){
                scope.data = MetadataService.getData();

                scope.dimDate = scope.data.dimension(function(d){
                    var dateFrom = parseDate(d.extras["temporal_coverage-from"]);
                    var dateTo = parseDate(d.extras["temporal_coverage-to"]);
                    return {from: dateFrom, to: dateTo};
                });

                scope.dateGroup = scope.dimDate.group().reduce(
                    function (p,v){
                        var from = v.extras["temporal_coverage-from"];
                        var to = v.extras["temporal_coverage-to"];
                        if (from != undefined){
                            var toDate = to == undefined ? new Date() : parseDate(to);
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
                    function (p,v) {
                        var from = v.extras["temporal_coverage-from"];
                        var to = v.extras["temporal_coverage-to"];
                        if (from != undefined){
                            var toDate = to == undefined ? new Date() : parseDate(to);
                            for (var i = parseDate(from).getFullYear(); i <= toDate.getFullYear(); i++){
                                p.years[i]--;
                                if (p.years[i] === 0){
                                    delete p.years[i];
                                }
                            }
                        }
                        return p;
                    },
                    function (){
                        return {
                            years: {}
                        };
                    }
                );

                scope.initSvg();
            };

            scope.initSvg = function(){
                scope.updateCurrentMappings();

                /*
                    - oben und rechts braucht man keine Abstaende
                    (1px muss wegen des kleinen vertikalen Strichs am Ende der x-Achse da sein)
                    - kleinere Unten- und Linkswerte schneiden die Achsenbeschriftungen ab
                    - NUR mit der Breite und Hoehe darf fuer die Anpassung gespielt werden
                 */
                scope.svgParams.mainMargin = {top: 5, right: 1, bottom: 130, left: 27};
                scope.svgParams.miniMargin = {top: 235, right: 1, bottom: 30, left: 27};
                scope.svgParams.width = 750;
                scope.svgParams.mainHeight = 300 - scope.svgParams.mainMargin.top - scope.svgParams.mainMargin.bottom;
                scope.svgParams.miniHeight = 300 - scope.svgParams.miniMargin.top - scope.svgParams.miniMargin.bottom;

                scope.svgParams.zoom = d3.scale.linear()
                    .range([0, scope.svgParams.width])
                    .domain([0, scope.svgParams.width]);

                scope.svgParams.x = d3.scale.ordinal()
                    .domain(scope.svgParams.initialYears)
                    .rangeRoundBands([0, scope.svgParams.width], 0.1);
                scope.svgParams.xMini = d3.scale.ordinal()
                    .domain(scope.svgParams.initialYears)
                    .rangeRoundBands([0, scope.svgParams.width], 0.1);

                scope.svgParams.y = d3.scale.linear().range([scope.svgParams.mainHeight, 0]);
                scope.svgParams.yMini = d3.scale.linear().range([scope.svgParams.miniHeight, 0]);

                //scope.svgParams.x.domain(scope.svgParams.initialYears);
                //scope.svgParams.xMini.domain(scope.svgParams.initialYears);
                var currentValues = [];
                for(var key in scope.svgParams.currentMappings) {
                    currentValues.push(scope.svgParams.currentMappings[key].value);
                }
                scope.svgParams.y.domain([0, d3.max(currentValues)]);
                scope.svgParams.yMini.domain([0, d3.max(currentValues)]);



                scope.brushParams.start = scope.svgParams.xMini(scope.svgParams.initialYears[0]);
                scope.brushParams.end = scope.svgParams.xMini(scope.svgParams.initialYears[scope.svgParams.initialYears.length - 1]);
                scope.brushParams.diff = //scope.svgParams.xMini.rangeBand() +
                    scope.brushParams.end - scope.brushParams.start;
                scope.brushParams.step = scope.brushParams.diff / scope.svgParams.initialYears.length;
                scope.brushParams.brushedDomain = [];

                scope.svgParams.xAxis = d3.svg.axis()
                    .scale(scope.svgParams.x)
                    .orient("bottom");

                scope.svgParams.xAxisMini = d3.svg.axis()
                    .scale(scope.svgParams.xMini)
                    .orient("bottom");

                scope.svgParams.yAxis = d3.svg.axis()
                    .scale(scope.svgParams.y)
                    .orient("left")
                    .tickFormat(d3.format("d"));

                scope.svgParams.yAxisMini = d3.svg.axis()
                    .scale(scope.svgParams.yMini)
                    .orient("left")
                    .tickFormat(d3.format("d"));

                d3.select("#time-chart").append("a")
                    .attr("id", "time-chart-reset")
                    .attr("ng-click", "resetSelection()")
                    .attr("style", "cursor: pointer; display: block; visibility: hidden;")
                    .text("reset");

                var svg = d3.select("#time-chart").append("svg")
                    .attr("width", scope.svgParams.width + scope.svgParams.mainMargin.left + scope.svgParams.mainMargin.right)
                    .attr("height", scope.svgParams.mainHeight + scope.svgParams.mainMargin.top + scope.svgParams.mainMargin.bottom);

                scope.main = svg.append("g")
                    .attr("transform", "translate(" + scope.svgParams.mainMargin.left + "," + scope.svgParams.mainMargin.top + ")");

                scope.mini = svg.append("g")
                    .attr("transform", "translate(" + scope.svgParams.miniMargin.left + "," + scope.svgParams.miniMargin.top + ")");

                scope.main.append("g")
                    .attr("id", "xAxis")
                    .attr("class", "axis")
                    .attr("transform", "translate(0," + scope.svgParams.mainHeight + ")")
                    .call(scope.svgParams.xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em")
                    .attr("transform", function(d){return "rotate(-80)"});

                scope.main.append("g")
                    .attr("class", "axis")
                    .attr("id", "yAxis")
                    .call(scope.svgParams.yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Anzahl der Datensätze");

                scope.mini.append("g")
                    .attr("class", "axis")
                    .attr("id", "yAxisMini")
                    .attr("transform", "translate(0," + scope.svgParams.miniHeight + ")")
                    .call(scope.svgParams.xAxisMini)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em")
                    .attr("transform", function(d){return "rotate(-80)"});


                var onData = scope.main.selectAll(".bar")
                    .data(scope.svgParams.currentMappings);

                onData
                    .enter()
                    .append("rect")
                    .attr("x", function(d) { return scope.svgParams.x(d.year); })
                    .attr("width", scope.svgParams.x.rangeBand())
                    .attr("y", "0")
                    .attr("height", function(d) { return scope.svgParams.mainHeight; })
                    .attr("ng-mousedown", function(d){ return "handleMouseDown('"+ d.year+"')";})
                    .attr("ng-class", function(d){ return "{'barbg' : true, 'active': selectedYears.contains("+ d.year+")}";})
                    .attr("ng-mouseover", function(d){ return "handleHover($event, '"+ d.year+"', '"+d.value+"')";})
                    .attr("ng-mouseleave", function(d){ return "resetHovers()";});

                onData
                    .enter()
                    .append("rect")
                    .attr("x", function(d) { return scope.svgParams.x(d.year); })
                    .attr("id", function(d) { return "time-chart-bar-"+d.year; })
                    .attr("width", scope.svgParams.x.rangeBand())
                    .attr("y", function(d) { return scope.svgParams.y(d.value); })
                    .attr("height", function(d) { return scope.svgParams.mainHeight - scope.svgParams.y(d.value); })
                    .attr("ng-mousedown", function(d){ return "handleMouseDown('"+ d.year+"')";})
                    .attr("ng-class", function(d){ return "{'bar': true, 'active': selectedYears.contains("+ d.year+")}";})
                    .attr("ng-mouseover", function(d){ return "handleHover($event, '"+ d.year+"', '"+d.value+"')";})
                    .attr("ng-mouseleave", function(d){ return "resetHovers()";});


                scope.mini.selectAll(".bar")
                    .data(scope.svgParams.currentMappings)
                    .enter()
                    .append("rect")
                    .attr("id", function(d) { return "time-chart-bar-mini-"+d.year; })
                    .attr("x", function(d) { return scope.svgParams.xMini(d.year); })
                    .attr("width", scope.svgParams.xMini.rangeBand())
                    .attr("y", function(d) { return scope.svgParams.yMini(d.value); })
                    .attr("height", function(d) { return scope.svgParams.miniHeight - scope.svgParams.yMini(d.value); });

                scope.brush = d3.svg.brush()
                    .x(scope.svgParams.xMini)
                    .on("brush", scope.brushed);

                scope.mini.append("g")
                    .attr("class", "x brush")
                    .call(scope.brush)
                    .selectAll("rect")
                    .attr("y", -10)
                    .attr("height", scope.svgParams.miniHeight + 15);

                $compile(angular.element('#time-chart'))(scope);
            };

            scope.$on('filterChanged', function() {
                scope.updateCurrentMappings();

                var usedMappings = {};
                if (!scope.brush.empty()){
                    usedMappings = scope.brushParams.brushedMappings;
                }
                else {
                    usedMappings = scope.svgParams.currentMappings;

                }
                scope.svgParams.y.domain([0, d3.max(usedMappings, function (d) { return d.value; })]);
                console.log(scope.svgParams.y.domain());
                scope.svgParams.yAxis.scale(scope.svgParams.y);
                scope.main.select("#yAxis").call(scope.svgParams.yAxis);

                scope.svgParams.yMini.domain([0, d3.max(scope.svgParams.currentMappings, function (d) { return d.value; })]);
                scope.svgParams.yAxisMini.scale(scope.svgParams.yMini);
                scope.main.select("#yAxisMini").call(scope.svgParams.yAxisMini);

                scope.svgParams.currentMappingsMod = {};
                for (var key in scope.svgParams.currentMappings){
                    scope.svgParams.currentMappingsMod[scope.svgParams.currentMappings[key].year] = scope.svgParams.currentMappings[key].value;
                }
                var simplifiedBrushMappings = {};
                for (var key in scope.brushParams.brushedMappings){
                    simplifiedBrushMappings[scope.brushParams.brushedMappings[key].year] = scope.brushParams.brushedMappings[key].value;
                }

                for (var key in scope.svgParams.initialYears){
                    var year = scope.svgParams.initialYears[key];
                    var chartBarMain = angular.element("#time-chart-bar-"+year);
                    var chartBarMini = angular.element("#time-chart-bar-mini-"+year);

                    if (scope.svgParams.currentMappingsMod[year]){
                        chartBarMain
                            .attr("y", scope.svgParams.y(scope.svgParams.currentMappingsMod[year]))
                            .attr("height", function(d) { return scope.svgParams.mainHeight - scope.svgParams.y(scope.svgParams.currentMappingsMod[year]); });
                        chartBarMini
                            .attr("y", scope.svgParams.yMini(scope.svgParams.currentMappingsMod[year]))
                            .attr("height", function(d) { return scope.svgParams.miniHeight - scope.svgParams.yMini(scope.svgParams.currentMappingsMod[year]); });
                    }
                    else {
                        chartBarMain.attr("height", "0");
                        chartBarMini.attr("height", "0");
                    }
                }

            });

            scope.filterFunction = function(d){
                var years = scope.selectedYears.values();
                for (var index in years) {
                    var year = years[index];
                    if (d.from != undefined && d.to != undefined){
                        if (d.from.getFullYear() <= year && year <= d.to.getFullYear()){
                            return true;
                        }
                    }
                    else if (d.from != undefined){
                        if (d.from.getFullYear() <= year){
                            return true;
                        }
                    }
                    else if (d.to != undefined){
                        if (year <= d.to.getFullYear()){
                            return true;
                        }
                    }
                }
                return false;
            };

            scope.updateCurrentMappings = function(){
                var yearsAndNumbers = scope.dateGroup.top(1)[0].value.years;
                var years = Object.keys(yearsAndNumbers);

                scope.svgParams.currentMappings = [];
                for (var index in years){
                    scope.svgParams.currentMappings.push({year:years[index], value:yearsAndNumbers[years[index]]});
                }

                if (!scope.svgParams.initialYears){
                    scope.svgParams.initialYears = years;
                }

                scope.spanVisible = MetadataService.length() > 0;
                if(scope.spanVisible){//only do this if there are values to extract
                    var all = scope.dimDate.top(Infinity);
                    var earliest = new Date(2900,0,1),
                        latest = new Date(1900, 0, 1);
                    for (var key in all){
                        var ds = all[key];
                        if (ds.extras != undefined) {
                            if (ds.extras["temporal_coverage-from"] != undefined){
                                if (parseDate(ds.extras["temporal_coverage-from"]) < earliest){
                                    earliest = parseDate(ds.extras["temporal_coverage-from"]);
                                    scope.availableFrom = ds.extras["temporal_coverage-from"];
                                }
                            }
                            if (ds.extras["temporal_coverage-to"] != undefined){
                                if (latest < parseDate(ds.extras["temporal_coverage-to"])){
                                    latest = parseDate(ds.extras["temporal_coverage-to"]);
                                    scope.availableTo = ds.extras["temporal_coverage-to"];
                                }
                            }
                        }
                    }
                }
            };

            scope.resetSelection = function (e) {
                $("#time-chart-reset").css("visibility","hidden");
                scope.selectedYears.clear();
                scope.dimDate.filterAll();
                MetadataService.triggerUpdate();
            };

            scope.handleMouseDown = function (year) {
                scope.hover.selectionType = scope.selectedYears.contains(year) ?
                    scope.selectionType.REMOVE :
                    scope.selectionType.ADD;
                scope.hover.mouseDownYear = year;
                scope.toggle(year);
                MetadataService.triggerUpdate();
            };

            scope.toggle = function(year) {
                if(scope.hover.selectionType == scope.selectionType.REMOVE) {
                    scope.selectedYears.remove(year);
                }
                else {
                    scope.selectedYears.add(year);
                }

                if (scope.selectedYears.values().length == 0){
                    $("#time-chart-reset").css("visibility","hidden");
                    scope.dimDate.filterAll();
                }
                else {
                    $("#time-chart-reset").css("visibility","visible");
                    scope.dimDate.filter(scope.filterFunction);
                }
            };

            scope.handleHover = function ($event, year, value) {
                scope.hover.year = year;
                var val = 0;
                for (var key in scope.svgParams.currentMappings){
                    if (scope.svgParams.currentMappings[key].year == year){
                        val = scope.svgParams.currentMappings[key].value;
                    }
                }
                scope.hover.value = val;
                if ($event.which == 1) {
                    var start = scope.svgParams.initialYears.indexOf(scope.hover.mouseDownYear);
                    var end = scope.svgParams.initialYears.indexOf(year);

                    if (start > end){
                        var temp = end;
                        end = start;
                        start = temp;
                    }

                    for (var i = start; i <= end; i++) {
                        scope.toggle(scope.svgParams.initialYears[i]);
                    }
                    scope.hover.mouseDownYear = year;
                    MetadataService.triggerUpdate();
                }
            };

            scope.resetHovers = function () {
                scope.hover.year = "";
                scope.hover.value = "";
            };

            scope.brushed = function () {
                var originalRange = scope.svgParams.zoom.range();
                scope.svgParams.zoom.domain(scope.brush.empty() ?
                    originalRange:
                    scope.brush.extent());

                var brushStart = scope.svgParams.zoom.domain()[0];
                var brushEnd = scope.svgParams.zoom.domain()[1];

                var startYear = scope.brushPositionToYear(brushStart);
                var endYear = scope.brushPositionToYear(brushEnd);

                scope.brushParams.brushedMappings = [];
                var valuesWithinBrushedArea = scope.svgParams.currentMappings.map(function(d){
                    if ((parseInt(d.year) >= startYear && parseInt(d.year) <= endYear)){
                        scope.brushParams.brushedMappings.push(d);
                        return d.value;
                    }
                    return 0;
                });

                scope.svgParams.y.domain([0, d3.max(valuesWithinBrushedArea)]);
                scope.svgParams.yMini.domain([0, d3.max(valuesWithinBrushedArea)]);

                scope.main.select("#yAxis").call(scope.svgParams.yAxis);

                scope.brushParams.brushedDomain = [];
                for (var i = scope.svgParams.initialYears.indexOf(startYear);
                     i <= scope.svgParams.initialYears.indexOf(endYear); i++) {
                    scope.brushParams.brushedDomain.push(scope.svgParams.initialYears[i]+"");
                }
                scope.svgParams.x.domain(scope.brushParams.brushedDomain);

                scope.main.select("#xAxis")
                    .call(scope.svgParams.xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em")
                    .attr("transform", function(d){return "rotate(-80)"});

                scope.main
                    .selectAll("rect")
                    .attr("x", function (d) {
                        var xPos = scope.svgParams.x(d.year);
                        var tr = xPos;
                        if (xPos + scope.svgParams.x.rangeBand() < scope.brushParams.start){
                            xPos = -1000;
                        }
                        else if (xPos < scope.brushParams.start){
                            xPos = scope.brushParams.start;
                        }
                        else
                        if (xPos == undefined){
                            return -1000;
                        }
                        return xPos;
                    })
                    .attr("width", function(d) {
                        var xPos = scope.svgParams.x(d.year);
                        if (xPos + scope.svgParams.x.rangeBand() < scope.brushParams.start){
                            return 0;
                        }
                        else if (xPos < scope.brushParams.start){
                            return xPos + scope.svgParams.x.rangeBand() - scope.brushParams.start;
                        }
                        return scope.svgParams.x.rangeBand();
                    });

                scope.main.selectAll(".bar")
                    .attr("y", function(d) {
                        var currentValueForYear = scope.currentValueForYear(d.year);
                        return scope.svgParams.y(currentValueForYear);
                    })
                    .attr("height", function(d) {
                        var currentValueForYear = scope.currentValueForYear(d.year);
                        return scope.svgParams.mainHeight - scope.svgParams.y(currentValueForYear);
                    });

                scope.main.selectAll(".barbg")
                    .attr("y", "0")
                    .attr("height", scope.svgParams.mainHeight);

            };

            scope.brushPositionToYear = function(brushPosition){
                var distanceFromStart = brushPosition - scope.brushParams.start;
                if (distanceFromStart < 0){
                    distanceFromStart = 0;
                }

                var offset = Math.floor(distanceFromStart / scope.brushParams.step);

                if (offset >= scope.svgParams.initialYears.length){
                    offset = scope.svgParams.initialYears.length - 1;
                }

                return scope.svgParams.initialYears[offset];
            };

            scope.currentValueForYear = function(year){
                var retVal = (scope.svgParams.currentMappingsMod[year]) ? scope.svgParams.currentMappingsMod[year] : 0;
                return retVal;
            }

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
