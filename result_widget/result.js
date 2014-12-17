Videbligo.directive('result', ['MetadataService', function (MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'result_widget/result.html',
        scope: {
            elementsPerPage: '@'
        },
        link: function (scope, element, attrs) {
            scope.crossData = [];
            scope.entries = [];
            scope.length = 0;
            scope.dimOne = null;

            scope.elementsPerPage = 20;

            scope.init = function () {
                var data = MetadataService.getData();
                scope.dimOne = data.dimension(function (d) {
                    return d;
                });
                /* Set of */
                scope.visibleDetailsDivs = new StringSet();
                scope.licence_mapping = licence_mapping;
                scope.category_mapping = category_mapping;

                if(attrs.elementsPerPage) {
                    scope.elementsPerPage = parseInt(attrs.elementsPerPage);
                }

                scope.maxPage = Math.ceil(scope.length / scope.elementsPerPage);
            };
            MetadataService.registerWidget(scope.init);

            scope.$on('filterChanged', function () {
                scope.entries = scope.dimOne.top(Infinity);
                scope.length = MetadataService.length();
            });

            //default value for orderProp
            scope.orderProp = 'age';

            
            /**
             * Item *key* zum Set der aktuell sichtbaren Elemente hinzufuegen oder aus diesem loeschen
             *
             * @param key
             */
            scope.toggleVisible = function (key) {
                if(scope.visibleDetailsDivs.contains(key)) {
                    scope.visibleDetailsDivs.remove(key);
                } else {
                    scope.visibleDetailsDivs.add(key);
                }
            };

        }
    };
}]);