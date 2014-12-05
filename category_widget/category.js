Videbligo.directive('category', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'category_widget/category.html',
        scope: {},
        link: function(scope, element, attrs) {
            scope.categories = {};

            scope.init = function(){
                var data = MetadataService.getData();
                scope.dimCategory = data.dimension(function(d){return d.groups;});
                //temporary, second needed so the group always has the newest values, don't know why
                var tmpCategory = data.dimension(function(d){return d.groups;});
                scope.groupCategory = tmpCategory.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);
                for(var key in scope.groupCategory.value())
                {
                    scope.categories[key] = {}
                    scope.categories[key].checked = true;
                    scope.categories[key].size = scope.groupCategory.value()[key];
                }
            }

            scope.$on('filterChanged', function() {
                for(var key in scope.groupCategory.value())
                    scope.categories[key].size = scope.groupCategory.value()[key];
            });

            scope.categoryChecked = function(index)
            {
                var checkedCategories = [];
                for(var key in scope.categories)
                    if(scope.categories[key].checked)
                        checkedCategories.push(key);

                var filterFunction = function(d)
                {
                    var tmp = d.filter(function(n) {
                        return checkedCategories.indexOf(n) != -1
                    });
                    return tmp.length > 0;
                }

                scope.dimCategory.filter(filterFunction);
                MetadataService.triggerUpdate();
            }


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

            MetadataService.registerWidget(scope.init);
        }
    };
}]);
