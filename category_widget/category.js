ExampleApp.directive('category', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'category_widget/category.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.categories = [];

            scope.$on('init', function() {
                var data = MetadataService.getData();
                scope.dimCategory = data.dimension(function(d){return d.groups;});
                scope.groupCategory = scope.dimCategory.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);

            });

            scope.$on('filterChanged', function() {
            });

            scope.reduceAdd = function (p, v) {
                v.groups.forEach (function(val, idx) {
                    p[val] = (p[val] || 0) + 1; //increment counts
                });
                return p;
            };

            scope.reduceRemove = function(p, v) {
                v.groups.forEach (function(val, idx) {
                    p[val] = (p[val] || 0) - 1; //decrement counts
                });
                return p;
            };

            scope.reduceInitial = function() {
                return {};
            }

        }
    };
}]);
