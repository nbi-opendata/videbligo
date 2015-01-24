// Hier kann man zentral die Farben der Karte ändern

if (!document.styleSheets){
    console.log("Please enable styleSheets");
} else {
    var theRules = new Array();

    for( var i = 0; i < document.styleSheets.length; i++){
        if (document.styleSheets[i].cssRules)
            theRules = document.styleSheets[i].cssRules
        else if (document.styleSheets[i].rules)
            theRules = document.styleSheets[i].rules

        if( theRules[0].selectorText == '.mapIdentifier'){
            // alert(i);
            break;
        }
    }
}

colorHover = theRules[theRules.length - 1].style.color;
colorClicked = theRules[theRules.length - 2].style.color;
colorUnclicked = theRules[theRules.length - 3].style.color;

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

                    if(scope.regionData['Berlin'].clicked){
                        allBerlin.style.stroke = colorClicked;
                    }
                    else{
                        allBerlin.style.stroke = "#000";
                    }
                    scope.regionChoice("Berlin");
                }
            }

            // zeigt hover an, und verstärkt den Rand, wenn wir nich über der SVG-Karte hovern
            scope.berlinMouseOver = function(){
                if(!onSvg) {
                    d3.select('#mapChart').text("Berlin" + "(" + scope.regionData['Berlin'].value + ")");
                    $('#mapChart').css('visibility', 'visible');

                    if(scope.regionData['Berlin'].clicked){
                        allBerlin.style.stroke = colorClicked;
                    }
                    else{
                        allBerlin.style.stroke = "#000";
                    }
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
                allBerlin.style.strokeWidth = 13;

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
                allBerlin.style.stroke = "#000";
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
        templateUrl: 'map_widget/berlin_map_ohne_kk.svg',
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

            // Falls eine Region angeklickt wird, setzen wir einen boolean um den Zustand zu speichern und ändern die Farbe
            scope.regionClick = function () {
                scope.regionData[scope.elementId].clicked = !scope.regionData[scope.elementId].clicked;
                if(element[0].getAttribute("fill") !=colorClicked){
                    element[0].setAttribute("fill", colorClicked);
                }
                else{
                    element[0].setAttribute("fill", colorHover);
                }
            };

            // Beim Hover / MouseOver verändern wir die Farbe der Region und zeigen das div pop-up an
            scope.regionMouseOver = function () {
                onSvg = true;
                allBerlin.style.strokeWidth = 0;
                scope.hoverRegion = scope.elementId;
                element[0].parentNode.appendChild(element[0]);
                element[0].style.strokeWidth = 4.5 ;
                element[0].style.stroke = '#000';

                if(element[0].getAttribute("fill") !=colorClicked){
                    element[0].setAttribute("fill", colorHover);
                }
                d3.select('#mapChart').text(scope.elementId + "(" + scope.regionData[scope.elementId].value + ")");
                $('#mapChart').css('visibility', 'visible');

                if(scope.elementId == 'Berlin'){
                    $('#textPosition').css('visibility', 'visible');
                }
            };

            // Beim MouseLeave setzen wir die richtige Farbe durch einen Vergleich
            scope.regionMouseLeave = function(){
                element[0].style.strokeWidth = 2;
                element[0].style.stroke = '#000';
                if(element[0].getAttribute('fill') !=colorClicked){
                    element[0].setAttribute('fill', colorUnclicked);
                }
                $('#mapChart').css('visibility', 'hidden');

                if(scope.elementId == 'Berlin'){
                    $('#textPosition').css('visibility', 'hidden');
                }
                onSvg = false;

            }

            // Hier werden Funktionen zugeordnet

            element[0].style.strokeWidth = 2;
            element[0].style.stroke = '#000';

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

// Initialisierungsfarbe der Regionen.
Videbligo.filter('map_color', [function () {
    return function (input) {
        return colorUnclicked;
    }
}]);

