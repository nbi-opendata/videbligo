Videbligo.directive('globalreset', ['MetadataService', '$rootScope', function(MetadataService, $rootScope) {

    return {
        restrict: 'AE',
        templateUrl: 'globalreset_widget/globalreset.html',
        scope: {
        },
        link: function(scope, element, attrs) {

            scope.init = function () {
                scope.initLength = scope.length = MetadataService.length();
            };

            MetadataService.registerWidget(scope.init);

            scope.resetAll = function() {
                $rootScope.$broadcast('globalreset');
            };

            scope.$on('filterChanged', function() {
                scope.length = MetadataService.length();
            });
        }
    };
}]);
