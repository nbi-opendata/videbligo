Videbligo.directive('map', ['MetadataService', '$compile', function (MetadataService, $compile) {

    return {
        restrict: 'AE',
        templateUrl: 'map_widget/map.html',
        scope: {},
        link: function (scope, element, attrs) {
            scope.districts = [];
            scope.dataTemp = {};
            scope.regionsAll = regionsAll;

            scope.selected_districts = new StringSet();
            scope.hovered_district = 'none';

            scope.init = function () {
                scope.RegData = MetadataService.getData();

                /* create dimension and group (TODO: explain, what group means)*/
                scope.dimRegion = scope.RegData.dimension(function (d) {return d.extras['geographical_coverage'];});
                scope.groupRegion = scope.dimRegion.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);

                /* TODO: simplify */
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

                /* little hack for the handling of the Berlin Border case */
                var svg = $('svg');
                svg.attr('data-ng-click', 'clickBrandenburg()');
                svg.attr('data-ng-mouseenter', 'enterDistrict("Berlin")');
                svg.attr('data-ng-mouseleave', 'leaveBrandenburg()');
                $('#berlinBorder').attr('data-ng-class', '{  \'selected\': selected_districts.contains("Berlin"), ' +
                                                            '\'hovered\': hovered_district == "Berlin",' +
                                                            '\'selected_hovered\': hovered_district == "Berlin" && selected_districts.contains("Berlin")}');

                /* recompile to enable the data-ng stuff from above */
                $compile(svg)(scope);
            };

            scope.clickBrandenburg = function () {
                /* check if no other district is hovered */
                if(scope.hovered_district == 'Berlin') {
                    scope.clickDistrict('Berlin');
                }
            };

            scope.leaveBrandenburg = function () {
                /* check if no other district was hovered */
                if(scope.hovered_district == 'Berlin') {
                    scope.hovered_district = "none";
                }
            };

            scope.enterDistrict = function (district) {
                scope.hovered_district = district;
            };

            scope.leaveDistrict = function (district) {
                /* reset to Berlin to highlight the border if mouse hovers over Brandenburg */
                scope.hovered_district = 'Berlin';
            };

            scope.clickDistrict = function (district) {
                /* add remove district from set of districts */
                scope.selected_districts.toggle(district);

                var filterFunction = function (d) { return scope.selected_districts.contains(d); };

                if(scope.selected_districts.values().length == 0) {
                    /* remove filter if nothing is selected */
                    scope.dimRegion.filterAll();
                } else {
                    /* add filter for this dimension */
                    scope.dimRegion.filter(filterFunction);
                }
                MetadataService.triggerUpdate();

            };

            MetadataService.registerWidget(scope.init);

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

            /* remove all districts from set of selected districts */
            scope.reset = function () {
                scope.selected_districts.clear();
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