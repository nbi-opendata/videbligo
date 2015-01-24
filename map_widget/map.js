Videbligo.directive('map', ['MetadataService', '$compile', function (MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'map_widget/map.html',
        scope: {},
        link: function (scope, element, attrs) {
            scope.districts = [];
            scope.dataTemp = {};
            scope.regionsAll = ['Pankow', 'Berlin-Mitte', 'Lichtenberg', 'Marzahn-Hellersdorf', 'Reinickendorf', 'Spandau',
                'Treptow-Köpenick', 'Neukölln', 'Tempelhof-Schöneberg', 'Steglitz-Zehlendorf', 'Friedrichshain-Kreuzberg',
                'Charlottenburg-Wilmersdorf', 'Berlin'
            ];

            scope.selected_districts = new StringSet();
            scope.hovered_district = 'none';

            scope.init = function () {
                scope.RegData = MetadataService.getData();

                // Dimension erstellen, und diese dann gruppieren
                scope.dimRegion = scope.RegData.dimension(function (d) {return d.extras['geographical_coverage'];});
                scope.groupRegion = scope.dimRegion.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);

                // Daten(Name, Anzahl der Datensätze ) von den Regionen in eine Liste stecken
                scope.regionsAll.forEach(function (region) {
                    var value = 0;
                    if(scope.groupRegion.value()[region] != undefined) {
                        value = scope.groupRegion.value()[region];
                    }
                    scope.districts.push({key: region, value: value});
                    scope.dataTemp[region] = ({key: region, value: value, clicked: false});
                });
                scope.regionData = scope.dataTemp;

                /* add click and hover handler to each district */
                angular.forEach($('.bezirk'), function (path, key) {
                    var regionElement = $(path);
                    var id = regionElement.attr('id');

                    regionElement.attr('data-ng-click', 'clickDistrict("' + id + '")');
                    regionElement.attr('data-ng-mouseenter', 'enterDistrict("' + id + '")');
                    regionElement.attr('data-ng-mouseleave', 'leaveDistrict("' + id + '")');

                    regionElement.attr('data-ng-class', '{\'selected\': selected_districts.contains("' + id + '")}');
                });
                $('svg').attr('data-ng-click', 'clickBrandenburg()');
                $compile($('svg'))(scope);
                $('.svg').insertBefore('<div id="foobar">Fooooo</div>');
                $compile($('#foobar'))(scope);

            };


            scope.clickBrandenburg = function(){
                console.log('Brandenburg');
            };

            scope.clickDistrict = function (bezirk) {
                console.log(bezirk);
                // toggle district in set of selected districts
                if(scope.selected_districts.contains(bezirk)) {
                    scope.selected_districts.remove(bezirk);
                } else {
                    scope.selected_districts.add(bezirk);
                }

                var filterFunction = function (d) {
                    return scope.selected_districts.contains(d);
                };

                if(scope.selected_districts.values().length == 0) {
                    scope.dimRegion.filterAll();
                } else {
                    scope.dimRegion.filter(filterFunction);
                }
                MetadataService.triggerUpdate();

            };

            scope.enterDistrict = function (district) {
                scope.hovered_district = district;
            };

            scope.leaveDistrict = function () {
                scope.hovered_district = 'none';
            };

            MetadataService.registerWidget(scope.init);

            // Hier werden die Werte geupdatet, wenn ein neuer Filter irgendwo gesetzt wird
            scope.$on('filterChanged', function () {
                scope.districts.forEach(function (district) {
                    var value = 0;
                    if(scope.groupRegion.value()[district.key] != undefined) {
                        value = scope.groupRegion.value()[district.key];
                    }
                    district.value = value;
                    scope.regionData[district.key].value = value;
                });
            });

            // reset-function
            scope.reset = function () {
                scope.selected_districts = new StringSet();
                scope.dimRegion.filterAll();
                MetadataService.triggerUpdate();
            };

            // Eigene Reduce-Funktionen zum individuellen Gruppieren
            scope.reduceAdd = function (p, v) {
                var val = v.extras['geographical_coverage'];
                if(val === undefined || val === null) {
                    return p;
                }
                p[val] = (p[val] || 0) + 1;
                return p;
            };

            scope.reduceRemove = function (p, v) {
                var val = v.extras['geographical_coverage'];
                if(val === undefined || val === null) {
                    return p;
                }
                p[val] = (p[val] || 0) - 1;
                return p;
            };

            scope.reduceInitial = function () {
                return {};
            }
        }
    };
}]);