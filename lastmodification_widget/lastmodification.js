Videbligo.directive('lastmodification', ['MetadataService', '$compile', function(MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'lastmodification_widget/lastmodification.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.lastModGroup = {};
            scope.dimLastMod = {};
            scope.selectedMonths = new StringSet();
            scope.svgParams = {};
            scope.hoveredMonth = "";
            scope.hoveredValue = "";

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.dimLastMod = scope.data.dimension(function(d){
                    var modDate = new Date(d.metadata_modified);
                    var key = modDate.getFullYear()+"/";
                    if (modDate.getMonth() <= 9){
                        key += "0";
                    }
                    key += modDate.getMonth();
                    return key;
                });

                scope.lastModGroup = scope.dimLastMod.group().reduceCount();

                scope.initSvg();
            }

            scope.initSvg = function(){

                scope.svgParams.initialMonths = [];
                for (var i in scope.lastModGroup.all()){
                    scope.svgParams.initialMonths.push(scope.lastModGroup.all()[i].key);
                }

                scope.svgParams.margin = {top: 20, right: 20, bottom: 50, left: 40},
                    scope.svgParams.width = 500,
                    scope.svgParams.height = 300;

                scope.svgParams.x = d3.scale.ordinal().rangeRoundBands([0, scope.svgParams.width], .1);

                scope.svgParams.y = d3.scale.linear().range([scope.svgParams.height, 0]);


                scope.svgParams.x.domain(scope.lastModGroup.all().map(function(d) { return d.key; }));
                scope.svgParams.y.domain([0, d3.max(scope.lastModGroup.all(), function(d) { return d.value; })]);

                scope.svgParams.xAxis = d3.svg.axis()
                    .scale(scope.svgParams.x)
                    .orient("bottom");

                scope.svgParams.yAxis = d3.svg.axis()
                    .scale(scope.svgParams.y)
                    .orient("left")
                    .tickFormat(d3.format("d"));


                scope.svg = d3.select("#last-modification-chart").append("svg")
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

                scope.svg.select("g .x.axis")
                    .call(scope.svgParams.xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", "-.45em");

                scope.svg.select("g .y.axis")
                    .call(scope.svgParams.yAxis);

                var onData = scope.svg.selectAll(".bar")
                    .data(scope.lastModGroup.all());

                onData.enter()
                    .append("rect")
                    .attr("x", function(d) { return scope.svgParams.x(d.key); })
                    .attr("class", "barbg")
                    .attr("width", scope.svgParams.x.rangeBand())
                    .attr("y", "0")
                    .attr("height", function(d) { return scope.svgParams.height; })
                    .attr("ng-click", function(d){ return "toggle('"+ d.key+"')";})
                    .attr("ng-class", function(d){ return "{'active': selectedMonths.contains('"+ d.key+"')}";})
                    .attr("ng-mouseover", function(d){ return "hoveredMonth='"+ d.key+"';hoveredValue='"+d.value+"'"})
                    .attr("ng-mouseleave", function(d){ return "resetHovers()"});

                onData.enter()
                    .append("rect")
                    .attr("x", function(d) { return scope.svgParams.x(d.key); })
                    .attr("width", scope.svgParams.x.rangeBand())
                    .attr("y", function(d) { return scope.svgParams.y(d.value); })
                    .attr("height", function(d) { return scope.svgParams.height - scope.svgParams.y(d.value); })
                    .attr("ng-click", function(d){ return "toggle('"+ d.key+"')";})
                    .attr("ng-class", function(d){ return "{'bar': true, 'active': selectedMonths.contains('"+ d.key+"')}";})
                    .attr("ng-mouseover", function(d){ return "hoveredMonth='"+ d.key+"';hoveredValue='"+d.value+"'"})
                    .attr("ng-mouseleave", function(d){ return "resetHovers()"});

                $compile(angular.element('#last-modification-chart'))(scope);
            }

            scope.toggle = function(month) {
                if(scope.selectedMonths.contains(month)) {
                    scope.selectedMonths.remove(month);
                }
                else {
                    scope.selectedMonths.add(month);
                }

                if (scope.selectedMonths.values().length == 0){
                    $("#last-modification-chart-reset").css("visibility","hidden");
                    scope.dimLastMod.filterAll();
                }
                else{
                    $("#last-modification-chart-reset").css("visibility","visible");
                    scope.dimLastMod.filter(scope.filterFunction);
                }

                MetadataService.triggerUpdate();
            }

            scope.filterFunction = function(d){
                var months = scope.selectedMonths.values();
                for (var index in months) {
                    var month = months[index];
                    if (d == month){
                        return true;
                    }
                }
                return false;
            }

            scope.$on('filterChanged', function() {
                scope.svgParams.y.domain([0, d3.max(scope.lastModGroup.all(), function(d) { return d.value; })]);
                scope.svgParams.yAxis = d3.svg.axis()
                    .scale(scope.svgParams.y)
                    .tickFormat(d3.format("d"))
                    .orient("left");

                scope.svg.select("g .y.axis")
                    .call(scope.svgParams.yAxis);


                var minMappings = {};
                for (var key in scope.lastModGroup.all()){
                    minMappings[scope.lastModGroup.all()[key].key] = scope.lastModGroup.all()[key].value;
                }

                for (var key in scope.svgParams.initialMonths){
                    var month = scope.svgParams.initialMonths[key].key;
                    var chartBar = angular.element("#last-modification-chart-bar-"+month);
                    if (minMappings[month]){
                        chartBar
                            .attr("y", scope.svgParams.y(minMappings[month]))
                            .attr("height", function(d) { return scope.svgParams.height - scope.svgParams.y(minMappings[month]); });
                    }
                    else {
                        chartBar
                            .attr("y", scope.svgParams.y(0))
                            .attr("height", function(d) { return scope.svgParams.height - scope.svgParams.y(0); });
                    }

                }

            });

            scope.resetSelection = function () {
                console.log("resetSelection start");
                $("#last-modification-chart-reset").css("visibility","hidden");
                scope.selectedMonths.clear();
                scope.dimLastMod.filterAll();
                MetadataService.triggerUpdate();
                console.log("resetSelection end");
            }

            scope.resetHovers = function () {
                scope.hoveredMonth = "";
                scope.hoveredValue = "";
            }

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
