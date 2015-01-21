Videbligo.directive('result', ['MetadataService', function (MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'result_widget/result.html',
        scope: {
            elementsPerPage: '@'
        },//to separate the scope inside this directive from the one outside 
        link: function (scope, element, attrs) {
            scope.crossData = [];
            scope.entries = [];
            scope.length = 0;
            scope.dimOne = null;

            scope.elementsPerPage = 20; //for pagination

            scope.init = function () {
                var data = MetadataService.getData();
                scope.dimOne = data.dimension(function (d) { //to craet a dimention for crossfilter
                    return d;
                });
                /* Set of */
                scope.visibleDetailsDivs = new StringSet();
                scope.licence_mapping = licence_mapping;
                scope.category_mapping = category_mapping;

                if(attrs.elementsPerPage) {
                    scope.elementsPerPage = parseInt(attrs.elementsPerPage);
                }
                //to set the maximum number of pages , we need to represent the result .
                scope.maxPage = Math.ceil(scope.length / scope.elementsPerPage);
            };
            MetadataService.registerWidget(scope.init);

            scope.$on('filterChanged', function () {
                //to make the data ,which are in the dimention we made as our entries 
                scope.entries = scope.dimOne.top(Infinity);
                scope.length = MetadataService.length();
            });

            //default value for orderProp
            scope.orderProp = 'age';

            
            /**
             * the  Item *key* to set currently visible item or to delet it 
             *
             * @param key
             */
            scope.toggleVisible = function (key) {
                if(scope.visibleDetailsDivs.contains(key)) {
                    //to hide the details after the click on the down-arrow
                    scope.visibleDetailsDivs.remove(key);
                } else {
                    //to show the details after the click on the down-arrow 
                    scope.visibleDetailsDivs.add(key);
                }
            };

        }
    };
}]);
