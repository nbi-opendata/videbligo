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

            scope.$on('init', function() {
                scope.RegData = MetadataService.getData();

                // Dimension erstellen, und diese dann gruppieren
                scope.dimRegion = scope.RegData.dimension(function(d){return d.extras["geographical_coverage"];});
                scope.tempRegion = scope.RegData.dimension(function(d){return d.extras["geographical_coverage"];});
                scope.groupRegion = scope.dimRegion.group();

                scope.regionsAll.forEach(function(region){
                    var wasPushed = false;
                    for(var i=0; i<scope.groupRegion.all().length; i++) {
                        if (scope.groupRegion.all()[i].key == region){

                            scope.dimRegion.filter(function(d){
                                return d === region;
                            })
                            scope.districts.push({key:region , value: scope.RegData.groupAll().value(), checked: true });
                            scope.dimRegion.filterAll();
                            wasPushed = true;
                        }
                    }

                    // Falls kein Datensatz zu einer Region gehört, bekommt dieser den Wert 0
                    if(!wasPushed){
                        scope.districts.push({key:region , value: 0, checked: true});
                    }
                })
            });


            scope.$on('filterChanged', function() {
                for(var obj in scope.groupRegion.all()){
                    for(var entry in scope.districts) {
                        if (scope.districts[entry].key == scope.groupRegion.all()[obj].key){
                            scope.dimRegion.filter(function(d){
                                return d === scope.districts[entry].key;
                            })
                            scope.districts[entry].value = scope.RegData.groupAll().value();
                            scope.dimRegion.filterAll();
                        }
                    }
                }
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
                scope.$apply();

            }

            // nicht benötigt
            /*
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
            */
        }
    };
}]);
