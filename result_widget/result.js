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

            scope.currentPage = 1;
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

            scope.$on('filterChanged', function () {
                scope.currentPage = 1;
                scope.entries = scope.dimOne.top(Infinity);
                scope.length = MetadataService.length();
                scope.maxPage = Math.ceil(scope.length / scope.elementsPerPage);
            });

            MetadataService.registerWidget(scope.init);
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

            scope.incrementPage = function () {
                scope.currentPage += 1;
            };

            scope.decrementPage = function () {
                scope.currentPage -= 1;
            };

            scope.setPage = function (n) {
                scope.currentPage = n;
            }
        }
    };
}]);

Videbligo.filter('slice', function () {
    return function (arr, start, number) {
        return (arr || []).slice(Math.max(0, start), Math.min(start + number, arr.length));
    };
});

Videbligo.filter('paginator', function () {
    return function (arr, currentPage, lastPage) {
        currentPage = parseInt(currentPage);
        var firstPage = 1;
        lastPage = parseInt(lastPage);
        var paginating = 2;
        //firstPage = Math.max(currentPage - paginating, firstPage);
        //lastPage = Math.min(firstPage + paginating * 2, lastPage);

        //build page list
        if(currentPage <= lastPage && lastPage > 2 * paginating + 3) {

            // left border
            // 1 2 3 4 5 6 7 8 9 10
            // 1 o o o I o o ... 10
            if(currentPage - paginating < 4) {
                for (var i = 1; (i <= currentPage + paginating); i++) {
                    arr.push(i);
                }
                arr.push('…');
                arr.push(lastPage);
            }

            // center
            // 1 ... 4 5 6 7 8  ... 11
            // 1 ... o o I o o  ... 11
            else if(currentPage - paginating >= 4 && lastPage - (currentPage + paginating) > 2) {
                arr.push(1);
                arr.push('...');
                for (var i = currentPage - paginating; (i <= currentPage + paginating); i++) {
                    arr.push(i);
                }
                arr.push('…');
                arr.push(lastPage);
            }

            // right border
            // 1 2 3 4 5 6 7 8 9 10
            // 1 ... o o I o o o 10
            else if(currentPage + paginating >= lastPage - paginating && currentPage - paginating <= lastPage) {
                arr.push(1);
                arr.push('[…]');
                for (var i = currentPage - paginating; (i <= lastPage); i++) {
                    arr.push(i);
                }
            }
        } else {
            // 1 2 3 4 5 6 7 8 9
            //1 0 0 0 I 0 0 0 I
            for (var i = 1; (i <= lastPage); i++) {
                arr.push(i);
            }
        }

        return arr;
    };
});