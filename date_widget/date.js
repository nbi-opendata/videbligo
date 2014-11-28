/**
 * Created by Kadir on 21.11.2014.
 */

ExampleApp.directive('date', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'date_widget/date.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.available_from = "";
            scope.available_to = "";
            scope.span_visible = false;

            scope.$on('init', function() {
                scope.data = MetadataService.getData();
                scope.dimDateFrom = scope.data.dimension(function(d){return parseDate(d.extras["temporal_coverage-from"]);});
                scope.dimDateTo = scope.data.dimension(function(d){return parseDate(d.extras["temporal_coverage-to"]);});

                //initialize keyup event
                $("#w3_date").keyup(function (e) {
                    if (e.keyCode == 13){
                        var value = $('#w3_date').val();
                        scope.updateDimension(value);
                    }
                });
            });

            scope.updateDimension = function(value)
            {
                if (value === undefined || value === ""){
                    scope.dimDateFrom.filterAll();
                    scope.dimDateTo.filterAll();
                }
                else{
                    var passedDate = parseDate(value);
                    scope.dimDateFrom.filter(function(d){return d <= passedDate});
                    scope.dimDateTo.filter(function(d){return passedDate <= d});
                }
                MetadataService.triggerUpdate();
            }

            scope.$on('filterChanged', function() {
                scope.span_visible = MetadataService.length() > 0;
                if(scope.span_visible)//only do this if there are values to extract
                {
                    scope.available_from = scope.dimDateFrom.bottom(1)[0].extras["temporal_coverage-from"];
                    scope.available_to = scope.dimDateTo.top(1)[0].extras["temporal_coverage-to"];
                }
                scope.$apply();
            });
        }
    };
}]);
