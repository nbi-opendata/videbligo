onSvg = false;
allBerlin = null;
bezirke = null;


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

                // Daten(Name, Anzahl der Datensätze ) von den Regionen in eine Liste stecken
                scope.regionsAll.forEach(function(region){
                    var value = 0;
                    if(scope.groupRegion.value()[region] != undefined) {
                        value = scope.groupRegion.value()[region];
                    }
                    scope.districts.push({key:region , value: value});
                    scope.dataTemp[region] = ({key:region, value: value, clicked:false});
                })
                scope.regionData = scope.dataTemp;
            };

            MetadataService.registerWidget(scope.init);

            // Hier werden die Werte geupdatet, wenn ein neuer Filter irgendwo gesetzt wird
            scope.$on('filterChanged', function() {
                scope.districts.forEach(function(district) {
                    var value = 0;
                    if (scope.groupRegion.value()[district.key] != undefined){
                        value = scope.groupRegion.value()[district.key];
                    }
                    district.value = value;
                    scope.regionData[district.key].value = value;
                });
            });

            // Wir setzen einen boolean, falls eine Region ausgewählt wird.
            // Über diesen boolean, können über alle ausgewählten regionen iterieren und dann auf diesen Filtern
            // Falls keine Region ausgewählt ist, werden die Filter zurückgesetzt
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

            // filtert bei einem Klick >Berlin<,  wenn wir nicht auf der SVG-Karte sind
            scope.berlinClicked = function(){
                if(!onSvg){
                    scope.regionData['Berlin'].clicked = !scope.regionData['Berlin'].clicked;
                }
            }

            // zeigt hover an, und verstärkt den Rand, wenn wir nich über der SVG-Karte hovern
            scope.berlinMouseOver = function(){
                if(!onSvg) {
                    d3.select('#mapChart').text("Berlin" + "(" + scope.regionData['Berlin'].value + ")");
                    $('#mapChart').css('visibility', 'visible');

                    allBerlin.style.stroke = "#000";
                    allBerlin.style.strokeWidth = 13;

                    angular.forEach(bezirke, function(path){
                      path.style.strokeWidth = 2;
                      path.style.stroke = '#000';
                    })
                }
            }

            // blendet Hover wieder aus
            scope.berlinMouseLeave = function(){
                d3.select('#mapChart').text("Berlin" + "(" + scope.regionData['Berlin'].value + ")");
                $('#mapChart').css('visibility', 'hidden');
            }


            // reset-function
            scope.resetFilters = function(){
                scope.regionsAll.forEach(function(district){
                    scope.regionData[district].clicked = false;
                })

                angular.forEach(bezirke, function(region){
                    region.setAttribute('fill', colorUnclicked );
                })

                scope.dimRegion.filterAll();
                MetadataService.triggerUpdate();
            }


            // Eigene Reduce-Funktionen zum individuellen Gruppieren
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
        templateUrl: 'map_widget/berlin_map_border.svg',
        link: function (scope, element, attrs) {
            var regions = element[0].querySelectorAll('.bezirk');
            bezirke = regions;
            angular.forEach(regions, function (path, key) {
                var regionElement = angular.element(path);
                regionElement.attr('region', '');
                regionElement.attr('region-data', 'regionData');
                regionElement.attr('hover-region', 'hoverRegion');
                regionElement.attr('regions-all','regionsAll')
                $compile(regionElement)(scope);
            })
            allBerlin = element[0].querySelector('.Berlina');
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
            scope.hover = false;
            scope.clicked = false;

            // Falls eine Region angeklickt wird, setzen wir einen boolean um den Zustand zu speichern und ändern die Farbe
            scope.regionClick = function () {
                scope.clicked = !scope.clicked;
                scope.regionData[scope.elementId].clicked = scope.clicked;
            };

            // Beim Hover / MouseOver verändern wir die Farbe der Region und zeigen das div pop-up an
            scope.regionMouseOver = function () {
                onSvg = true;
                scope.hover = true;

            };

            // Beim MouseLeave setzen wir die richtige Farbe durch einen Vergleich
            scope.regionMouseLeave = function(){
                scope.hover = false;
                onSvg = false;
            }

            // Hier werden Funktionen zugeordnet

            element[0].style.strokeWidth = 2;
            element[0].style.stroke = '#000';

            element.attr('ng-click', 'regionClick()');
            element.attr('ng-mouseenter', 'regionMouseOver()');
            element.attr('ng-mouseleave', 'regionMouseLeave()');
            element.attr('ng-class', '{hover: hover, selected: clicked, selected_hover: clicked && hover, standard: !hover && !clicked}');
            element.removeAttr('region');
            $compile(element)(scope);
        }
    }
}]);

