Videbligo.directive('date', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'date_widget/date.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.available_from = "";
            scope.available_to = "";
            scope.span_visible = false;
            scope.date = undefined;

            scope.init = function(){
                scope.data = MetadataService.getData();
                scope.dimDateFrom = scope.data.dimension(function(d){return parseDate(d.extras["temporal_coverage-from"]);});
                scope.dimDateTo = scope.data.dimension(function(d){return parseDate(d.extras["temporal_coverage-to"]);});
            }

            scope.dateChanged = function() {
                var passedDate = scope.date;
                if (passedDate === undefined || passedDate === ""){
                    scope.dimDateFrom.filterAll();
                    scope.dimDateTo.filterAll();
                }
                else{
                    scope.dimDateFrom.filter(function(d){return d <= passedDate});
                    scope.dimDateTo.filter(function(d){return passedDate <= d});
                }
                MetadataService.triggerUpdate();
            }

            scope.$on('filterChanged', function() {
                scope.span_visible = MetadataService.length() > 0;
                if(scope.span_visible){//only do this if there are values to extract
                    scope.available_from = scope.dimDateFrom.bottom(Infinity)
                        .filter(function(d){return d.extras["temporal_coverage-from"] != undefined && d != ""; })
                        [0].extras["temporal_coverage-from"];
                    scope.available_to = scope.dimDateTo.top(Infinity)
                        .filter(function(d){return d.extras["temporal_coverage-to"] != undefined && d != "";})
                        [0].extras["temporal_coverage-to"];
                }
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
