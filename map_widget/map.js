Videbligo.directive('map', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'map_widget/map.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.districts = [];
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
                scope.tempRegion = scope.RegData.dimension(function(d){return d.extras["geographical_coverage"];});
                scope.groupRegion = scope.dimRegion.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);

                scope.regionsAll.forEach(function(region){
                    var value = 0;
                    if(scope.groupRegion.value()[region] != undefined)
                        value = scope.groupRegion.value()[region];
                    scope.districts.push({key:region , value: value, checked: true });
                })
            };

            MetadataService.registerWidget(scope.init);


            scope.$on('filterChanged', function() {
                scope.districts.forEach(function(district) {
                    var value = 0;
                    if(scope.groupRegion.value()[district.key] != undefined)
                        value = scope.groupRegion.value()[district.key];
                    district.value = value;
                });
            });

            scope.regionChecked = function(index){
                var checkedRegion = [];
                for(var key in scope.districts)
                    if(scope.districts[key].checked)
                        checkedRegion.push(scope.districts[key].key);

                scope.tempRegion.filter(function(d){
                    return checkedRegion.indexOf(d) != -1
                });

                MetadataService.triggerUpdate();
            }

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
