Videbligo.directive('globalreset', ['MetadataService', '$rootScope', function(MetadataService, $rootScope) {

    return {
        restrict: 'AE',
        templateUrl: 'globalreset_widget/globalreset.html',
        scope: {
        },
        link: function(scope, element, attrs) {

            scope.resetAll = function() {
                $rootScope.$broadcast('globalreset');
            }

        }
    };
}]);
