Videbligo.directive('category', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'category_widget/category.html',
        scope: {
            numberOfColumns: '@'
        },
        link: function(scope, element, attrs) {
            scope.categories = {};

            scope.numberOfColumns = 5;

            scope.init = function(){
                var data = MetadataService.getData();
                scope.dimCategory = data.dimension(function(d){return d.groups;});
                scope.groupCategory = scope.dimCategory.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);
                for(var key in scope.groupCategory.value()){
                    scope.categories[key] = {};
                    scope.categories[key].size = scope.groupCategory.value()[key];
                }
                scope.category_mapping = category_mapping;
                scope.selected_categories = new StringSet();
                scope.hovered_category = 'none';

                if(attrs.numberOfColumns) {
                    scope.numberOfColumns = parseInt(attrs.numberOfColumns);
                }

            };

            MetadataService.registerWidget(scope.init);

            scope.$on('filterChanged', function() {
                for(var key in scope.groupCategory.value())
                    scope.categories[key].size = scope.groupCategory.value()[key];
            });

            scope.toggle = function(key){
                if(scope.selected_categories.contains(key)){
                    scope.selected_categories.remove(key);
                }else{
                    scope.selected_categories.add(key);
                }

                var filterFunction = function(d) {
                    var tmp = d.filter(function(n) {
                        return scope.selected_categories.contains(n);
                    });
                    return tmp.length > 0;
                };

                if(scope.selected_categories.values().length == 0) {
                    scope.dimCategory.filterAll();
                }else{
                    scope.dimCategory.filter(filterFunction);
                }
                MetadataService.triggerUpdate();
            };

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