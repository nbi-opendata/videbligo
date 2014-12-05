Videbligo.directive('search', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'search_widget/search.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.searchCriteria = "";

            scope.init = function(){
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
            });

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
