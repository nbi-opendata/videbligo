/**
 * Created by Kadir on 21.11.2014.
 */

ExampleApp.directive('exWidget3', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'widget3/widget3.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.$on('init', function() {
                scope.data = MetadataService.getData();
                scope.dimDate = scope.data.dimension(function(d){return [d.extras["temporal_coverage-from"],d.extras["temporal_coverage-to"]];});

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
                scope.dimDate.filterAll();
                scope.dimDate.filter(function(d) {
                    if (d === undefined || d[0] === undefined || d[1] === undefined)
                        return false;

                    var passedDate = parseDate(value);
                    var dateFrom = parseDate(d[0]);
                    var dateTo = parseDate(d[1]);

                    return dateFrom < passedDate && passedDate < dateTo;
                });
                MetadataService.triggerUpdate();
            }

            scope.$on('filterChanged', function() {
            });
        }
    };
}]);
