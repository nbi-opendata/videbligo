Videbligo.directive('result', ['MetadataService', function (MetadataService) {

    return {
        restrict: 'AE',
        templateUrl: 'result_widget/result.html',
        scope: {},
        link: function (scope, element, attrs) {
            scope.crossData = [];
            scope.entries = [];
            scope.length = 0;
            scope.dimOne = null;

            scope.init = function () {
                var data = MetadataService.getData();
                scope.dimOne = data.dimension(function (d) {
                    return d;
                });
                /* Set of */
                scope.visibleDetailsDivs = new StringSet();
            };

            scope.$on('filterChanged', function () {
                scope.entries = scope.dimOne.top(25);
                scope.length = MetadataService.length();
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
        }
    };
}]);

Videbligo.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if(!value) {
            return '';
        }

        max = parseInt(max, 10);
        if(!max) {
            return value;
        }
        if(value.length <= max) {
            return value;
        }

        value = value.substr(0, max);
        if(wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if(lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});
