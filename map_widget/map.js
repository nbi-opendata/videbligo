// Hier kann man zentral die Farben der Karte ändern

colorUnclicked = '#73CAC6';
colorClicked = '#00D38A';
colorHover = '#FF8482';

Videbligo.directive('map', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'map_widget/map.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.districts = [];
            scope.dataTemp = {};
            scope.regionsAll = ['Pankow', 'Berlin-Mitte', 'Lichtenberg', 'Marzahn-Hellersdorf', 'Reinickendorf', 'Spandau',
                'Treptow-Köpenick', 'Neukölln', 'Tempelhof-Schöneberg', 'Steglitz-Zehlendorf', 'Friedrichshain-Kreuzberg',
                'Charlottenburg-Wilmersdorf', 'Berlin'
            ];

            // alphabetisch sortieren
            scope.regionsAll.sort();

            scope.init = function() {
                scope.RegData = MetadataService.getData();

                // Dimension erstellen, und diese dann gruppieren
                scope.dimRegion = scope.RegData.dimension(function(d){return d.extras['geographical_coverage'];});
                scope.groupRegion = scope.dimRegion.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);

                // Daten von den Regionen in ein Array stecken
                scope.regionsAll.forEach(function(region){
                    var value = 0;
                    if(scope.groupRegion.value()[region] != undefined) {
                        value = scope.groupRegion.value()[region];
                    }
                    scope.districts.push({key:region , value: value, checked: true });
                    scope.dataTemp[region] = ({key:region, value: value});
                })
                scope.regionData = scope.dataTemp;
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
                    scope.regionData[district.key].value = value;
                });
            });

            scope.regionChoice = function(key) {
                var checkedRegion = [];
                for (var obj in scope.regionData)
                    if (scope.regionData[obj].clicked){
                        checkedRegion.push(scope.regionData[obj].key);
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
                var val = v.extras['geographical_coverage'];
                if(val === undefined || val === null)
                    return p;
                p[val] = (p[val]|| 0) + 1;
                return p;
            }

            scope.reduceRemove= function (p, v) {
                var val = v.extras['geographical_coverage'];
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
                regionElement.attr('region', '');
                regionElement.attr('region-data', 'regionData');
                regionElement.attr('hover-region', 'hoverRegion');
                regionElement.attr('regions-all','regionsAll')
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
            regionData: "=",
            hoverRegion: "=",
            regionsAll: "="
        },
        link: function (scope, element, attrs) {
            scope.elementId = element.attr("id");

            // Hier kann man die Farbe der Karte ändern
            /*
             scope.colorUnclicked = '#FF0000';
             scope.colorClicked = '#00FF00';
             scope.colorHover = '#0000FF';
             */

            scope.regionClick = function () {
                if(element[0].getAttribute("fill") !=colorClicked){
                    element[0].setAttribute("fill", colorClicked);
                }
                else{
                    element[0].setAttribute("fill", colorHover);
                }
            };

            scope.regionMouseOver = function () {
                scope.hoverRegion = scope.elementId;
                element[0].parentNode.appendChild(element[0]);
                element[0].style.strokeWidth = 2.5;
                element[0].style.stroke = '#000';

                if(element[0].getAttribute("fill") !=colorClicked){
                    element[0].setAttribute("fill", colorHover);
                }
                d3.select('#mapChart').text(scope.elementId + "(" + scope.regionData[scope.elementId].value + ")");
                $('#mapChart').css('visibility', 'visible');
            };

            scope.regionMouseLeave = function(){
                element[0].style.strokeWidth = 2;
                element[0].style.stroke = '#fff';
                if(element[0].getAttribute('fill') !=colorClicked){
                    element[0].setAttribute('fill', colorUnclicked);
                }
                $('#mapChart').css('visibility', 'hidden');
            }

            element.attr('ng-click', 'regionClick()');
            element.attr('ng-attr-fill', '{{regionData[elementId] | map_color}}');
            element.attr('ng-mouseover', 'regionMouseOver()');
            element.attr('ng-mouseleave', 'regionMouseLeave()');
            element.attr('ng-class', '{active:hoverRegion == elementId}');
            element.removeAttr('region');
            $compile(element)(scope);
        }
    }
}]);

Videbligo.filter('map_color', [function () {
    return function (input) {

        // Initialisierungsfarbe der Regionen. Sollte äquivalent zu colorUnclicked sein
        // var color = '#FF0000';
        return colorUnclicked;
    }
}]);

Videbligo.directive('tooltip', function () {
    return {
        restrict:'AE',
        link: function(scope, element, attrs)
        {
            $(element)
                .attr('title',scope.$eval(attrs.tooltip))
                .tooltip({placement: 'right'});
        }
    }
})