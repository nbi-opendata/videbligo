/**
 * Created by Kadir on 21.11.2014.
 */

Videbligo.directive('search', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'search_widget/search.html',
        scope: {},
        link: function(scope, element, attrs) {

            scope.searchCriteria = "";

            var initialized = false;
            scope.init = function(){
                if(initialized)
                    return
                initialized = !initialized;
                scope.data = MetadataService.getData();
                scope.dimName = scope.data.dimension(function(d){return d.title;});
            }

            scope.updateDimension = function()
            {
                var value = scope.searchCriteria;
                scope.dimName.filterAll();
                scope.dimName.filter(function(d) {
                    d = d.toLowerCase();
                    value = value.toLowerCase();
                    return d.indexOf(value) > -1;
                });
                MetadataService.triggerUpdate();
            }

            scope.$on('filterChanged', function() {
                scope.init();
            });
        }
    };
}]);
