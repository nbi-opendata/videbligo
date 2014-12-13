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
                    scope.dataTemp[region] = ({value: value, hover:false, clicked:false});
                })
                scope.dataTemp["Lichtenberg"].clicked = true;
                scope.dummyData = scope.dataTemp;
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


            scope.regionChecked = function(key){
                /*
                 if(scope.selected_map.contains(key)){
                 scope.selected_map.remove(key);
                 =======
                 scope.regionChoice = function(index){
                 if(scope.selected_map.contains(index)){
                 scope.selected_map.remove(index);
                 }else {
                 scope.selected_map.add(index);
                 }
                 var filterFunction = function(d) {
                 var tmp = d.filter(function(n) {
                 return scope.selected_map.contains(n);
                 });
                 return tmp.length > 0;
                 };
                 if(scope.selected_map.values().length == 0) {
                 scope.dimRegion.filterAll();

                 }else{
                 scope.dimRegion.filter(filterFunction);
                 }


                 var filterFunction = function(d) {
                 var tmp = d.filter(function(n) {
                 return scope.selected_map.contains(n);
                 });
                 return tmp.length > 0;
                 };

                 if(scope.selected_map.values().length == 0) {
                 scope.dimRegion.filterAll();
                 }else{
                 scope.dimRegion.filter(filterFunction);
                 }
                 */


                var checkedRegion = [];
                for(var key in scope.districts)
                    if(scope.districts[key].checked)
                        checkedRegion.push(scope.districts[key].key);

                scope.dimRegion.filter(function(d){
                    return checkedRegion.indexOf(d) != -1
                });

                MetadataService.triggerUpdate();
            };

            scope.reduceAdd = function(p, v) {
                var val = v.extras["geographical_coverage"];
                if(val === undefined || val === null)
                    return p;
                p[val] = (p[val]|| 0) + 1
                return p;
            }

            scope.reduceRemove= function (p, v) {
                var val = v.extras["geographical_coverage"];
                if(val === undefined || val === null)
                    return p;
                p[val] = (p[val]|| 0) - 1
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
            scope.selected_map = new StringSet();
            scope.elementId = element.attr("id");

            scope.regionClick = function () {
                scope.dummyData[scope.elementId].clicked = !scope.dummyData[scope.elementId].clicked;
                //alert(scope.dummyData[scope.elementId].value);
                /*
                if(scope.selected_map.contains(scope.dummyData[scope.elementId].value)){
                    scope.selected_map.remove(scope.dummyData[scope.elementId].value);
                    element[0].setAttribute("fill", "#5b95bc");
                }else{
                    scope.selected_map.add(scope.dummyData[scope.elementId].value);
                    element[0].setAttribute("fill", "#C58D7E");
                }
                */
            };
            scope.regionMouseOver = function () {
                scope.hoverRegion = scope.elementId;
                element[0].parentNode.appendChild(element[0]);
                scope.dummyData[scope.elementId].hover = true;


            };

            scope.regionMouseLeave = function(){
                scope.dummyData[scope.elementId].hover = false;
            }

            scope.regionClass = function(){
                return {active:hoverRegion== elementId};
            }
            element.attr("ng-click", "regionClick()");
            element.attr("ng-attr-fill", "{{dummyData[elementId] | map_color}}");
            //element.attr("ng-attr-fill", "{{dummyData[elementId].value | map_color}}");
            element.attr("ng-mouseover", "regionMouseOver()");
            element.attr("ng-mouseleave", "regionMouseLeave()");
            element.attr("ng-class", "regionClass()");
            element.removeAttr("region");
            $compile(element)(scope);
        }
    }
}]);


 Videbligo.filter('map_color', [function () {
     return function (input) {
         var color = "#000000";
         if (input.clicked) {
             color = "#00FF00";
         } else if(input.hover){
             color = "#0000FF";
         } else{
             color ="#FF0000";
         }

         return color;
     }
 }]);




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


