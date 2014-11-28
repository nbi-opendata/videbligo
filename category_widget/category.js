function reduceAdd(p, v) {
    v.groups.forEach (function(val, idx) {
        p[val] = (p[val] || 0) + 1; //increment counts
    });
    return p;
}

function reduceRemove(p, v) {
    v.groups.forEach (function(val, idx) {
        p[val] = (p[val] || 0) - 1; //decrement counts
    });
    return p;

}

function reduceInitial() {
    return {};
}

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
                scope.groupCategory = scope.dimCategory.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial);

            });

            scope.$on('filterChanged', function() {
            });

        }
    };
}]);
