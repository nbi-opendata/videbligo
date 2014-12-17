Videbligo.directive('map', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'map_widget/map.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.districts = [];
            scope.dataTemp = {};
            scope.regionsAll = ["Pankow", "Berlin-Mitte", "Lichtenberg", "Marzahn-Hellersdorf", "Reinickendorf", "Spandau",
                "Treptow-Köpenick", "Neu-Köln", "Tempelhof-Schöneberg", "Steglitz-Zehlendorf", "Friedrichshain-Kreuzberg",
                "Charlottenburg-Wilmersdorf", "Berlin"
            ];

            // alphabetisch sortieren
            scope.regionsAll.sort();

            scope.init = function() {
                scope.RegData = MetadataService.getData();

                // Dimension erstellen, und diese dann gruppieren
                scope.dimRegion = scope.RegData.dimension(function(d){return d.extras["geographical_coverage"];});
                scope.groupRegion = scope.dimRegion.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);
                scope.selected_map = new StringSet();

                scope.regionsAll.forEach(function(region){
                    var value = 0;
                    if(scope.groupRegion.value()[region] != undefined) {
                        value = scope.groupRegion.value()[region];
                    }
                    scope.districts.push({key:region , value: value, checked: true });
                    scope.dataTemp[region] = ({key:region, value: value, hover:false, clicked:false});
                })
                scope.dummyData = scope.dataTemp;
                d3.select("#mapInfoBox")
                    .html('<div id="mapChart" ng-click="resetSelection()" style="position:absolute; right:30%;  visibility:hidden; border:2px solid cornflowerblue; background-color:yellow;">' +
                    'WRECK IT RALPH!!!  ' + scope.dataTemp["Lichtenberg"].value +
                    '</div>');
            };

            MetadataService.registerWidget(scope.init);

            scope.$on('filterChanged', function() {
                scope.districts.forEach(function(district) {
                    var value = 0;
                    if (scope.groupRegion.value()[district.key] != undefined){
                        value = scope.groupRegion.value()[district.key];
                    }
                    district.value = value;
                    // test
                    scope.dummyData[district.key].value = value;
                });
            });


            scope.regionChoice = function(key) {

                var checkedRegion = [];
                for (var obj in scope.dummyData)
                    if (scope.dummyData[obj].clicked){
                        checkedRegion.push(scope.dummyData[obj].key);
                    }

                var filterFunction = function(d){
                    return checkedRegion.indexOf(d) != -1;
                }

                if(checkedRegion.length != 0){
                    scope.dimRegion.filter(filterFunction);
                } else {
                    scope.dimRegion.filterAll();
                }

                MetadataService.triggerUpdate();
            };

            scope.reduceAdd = function(p, v) {
                var val = v.extras["geographical_coverage"];
                if(val === undefined || val === null)
                    return p;
                p[val] = (p[val]|| 0) + 1;
                return p;
            }

            scope.reduceRemove= function (p, v) {
                var val = v.extras["geographical_coverage"];
                if(val === undefined || val === null)
                    return p;
                p[val] = (p[val]|| 0) - 1;
                return p;
            }

            scope.reduceInitial = function() {
                return {};
            }

        }
    };
}]);

// for each divided districts parameter passed
Videbligo.directive('svgMap', ['$compile', function ($compile) {
    return {
        restrict: 'AE',
        templateUrl: 'map_widget/berlin_map.svg',
        link: function (scope, element, attrs) {
            var regions = element[0].querySelectorAll('.bezirk');
            angular.forEach(regions, function (path, key) {
                var regionElement = angular.element(path);
                regionElement.attr("region", "");
                regionElement.attr("dummy-data", "dummyData");
                regionElement.attr("hover-region", "hoverRegion");
                regionElement.attr("regions-all","regionsAll")
                $compile(regionElement)(scope);
            })
        }
    }
}]);

// User Interface : Mause-Click, Mause-Over
Videbligo.directive('region', ['$compile', function ($compile) {
    return {
        restrict: 'AE',
        scope: {
            dummyData: "=",
            hoverRegion: "=",
            regionsAll: "="
        },
        link: function (scope, element, attrs) {
            // scope.selected_map = new StringSet();
            scope.elementId = element.attr("id");
            scope.colorUnclicked = "#FF0000";
            scope.colorClicked = "#00FF00";
            scope.colorHover = "#0000FF";

            scope.regionClick = function () {
                scope.dummyData[scope.elementId].clicked = !scope.dummyData[scope.elementId].clicked;
                if(element[0].getAttribute("fill") !=scope.colorClicked){
                    element[0].setAttribute("fill", scope.colorClicked);
                }
                else{
                    element[0].setAttribute("fill", scope.colorHover);
                }
            };

            scope.regionMouseOver = function () {
                scope.hoverRegion = scope.elementId;
                element[0].parentNode.appendChild(element[0]);
                scope.dummyData[scope.elementId].hover = true;
                element[0].style.strokeWidth = 2.5;
                element[0].style.stroke = "#000";

                if(element[0].getAttribute("fill") !=scope.colorClicked){
                    element[0].setAttribute("fill", scope.colorHover);
                }
               d3.select("#mapChart").text(scope.elementId + "(" + scope.dummyData[scope.elementId].value + ")");
               $("#mapChart").css("visibility", "visible");
            };

            scope.regionMouseLeave = function(){
                scope.dummyData[scope.elementId].hover = false;
                element[0].style.strokeWidth = 2;
                element[0].style.stroke = "#fff";
                if(element[0].getAttribute("fill") !=scope.colorClicked){
                    element[0].setAttribute("fill", scope.colorUnclicked);
                }
                $("#mapChart").css("visibility", "hidden");
            }

            /*
            scope.regionClass = function(){
                return {active:hoverRegion== elementId};
            }
            */
            element.attr("ng-click", "regionClick()");
            element.attr("ng-attr-fill", "{{dummyData[elementId] | map_color}}");
            //element.attr("ng-attr-fill", "{{dummyData[elementId].value | map_color}}");
            element.attr("ng-mouseover", "regionMouseOver()");
            element.attr("ng-mouseleave", "regionMouseLeave()");
            element.attr("ng-class", "{active:hoverRegion == elementId}");

            element.removeAttr("region");
            $compile(element)(scope);
        }
    }
}]);

 Videbligo.filter('map_color', [function () {
     return function (input) {
         var color = "#FF0000";
         return color;
     }
 }]);

Videbligo.directive('tooltip', function () {
    return {
        restrict:'AE',
        link: function(scope, element, attrs)
        {
            $(element)
                .attr('title',scope.$eval(attrs.tooltip))
                //.attr('title', element.attr("id"))
                .tooltip({placement: "right"});
        }
    }
})
// Basic color of map
/*
Videbligo.filter('map_color', [function () {
    return function (input) {
        if(input.hover){
            return "#0000FF";
        }
        return "#5b95bc";

    }
}]);
*/



