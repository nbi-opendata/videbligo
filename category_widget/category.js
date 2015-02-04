Videbligo.directive('category', ['MetadataService', function(MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'category_widget/category.html',
        scope: {
            numberOfColumns: '@',
            deactivateEmptyCategories: '@'
        },
        link: function(scope, element, attrs) { //to make scope inside this directive different from the outside one 
            scope.categories = {};

            scope.numberOfColumns = 5;

            scope.init = function(){
                var data = MetadataService.getData();
                scope.dimCategory = data.dimension(function(d){return d.groups;});
                //custom group with own reduce functions
                scope.groupCategory = scope.dimCategory.groupAll().reduce(scope.reduceAdd, scope.reduceRemove, scope.reduceInitial);

                for(var key in scope.groupCategory.value()){
                    scope.categories[key] = {};
                    scope.categories[key].size = scope.groupCategory.value()[key];
                }
                scope.category_mapping = category_mapping;
                scope.selected_categories = new StringSet();
                scope.hovered_category = 'none';


                /* set Parameters */
                if(attrs.deactivateEmptyCategories == undefined) {
                    scope.deactivateEmptyCategories = true;
                }
                if(attrs.deactivateEmptyCategories){
                    scope.deactivateEmptyCategories = attrs.deactivateEmptyCategories.toLowerCase() === "true";
                }
                if(attrs.numberOfColumns) {
                    scope.numberOfColumns = parseInt(attrs.numberOfColumns);
                }

            };

            MetadataService.registerWidget(scope.init);

            scope.$on('filterChanged', function() {
                for(var key in scope.groupCategory.value())
                    scope.categories[key].size = scope.groupCategory.value()[key];
            });

            scope.$on('filterForCategory', function(event, args) {
                scope.toggle(args.category);
            });


            scope.$on('globalreset', function() {
                scope.reset();
            });


            scope.reset = function(){
                scope.dimCategory.filterAll();
                scope.selected_categories.clear();
                MetadataService.triggerUpdate();

            }

            //in the next function , if the category is selected , then after a click deselect ,if it is not selected then a fter a click ,make it selected 
            scope.toggle = function(key){
                scope.selected_categories.toggle(key);

                var filterFunction = function(d) {
                    var tmp = d.filter(function(n) {
                        return scope.selected_categories.contains(n);
                    });
                    return tmp.length > 0;
                };
                //if there is no selected categorie then select all of them .
                if(scope.selected_categories.values().length == 0) {
                    scope.dimCategory.filterAll();
                }else{ 
                   //if there is selected category , then filter the category dimention by the selected value(s) and amke an update 
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
