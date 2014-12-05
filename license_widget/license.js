Videbligo.directive('license', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'license_widget/license.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.dimLicense = {};

            var initialized = false;
            scope.init = function(){
                if(initialized)
                    return
                initialized = !initialized;
                var data = MetadataService.getData();
                scope.dimLicense = data.dimension(function(d){return d.license_id;});
                scope.groupLicense = scope.dimLicense.group();
            }

            scope.$on('filterChanged', function() {
                scope.init();
            });
        }
    };
}]);