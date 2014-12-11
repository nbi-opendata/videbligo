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
            }

            scope.$on('filterChanged', function () {
                scope.entries = scope.dimOne.top(25);
                scope.length = MetadataService.length();
            });

            MetadataService.registerWidget(scope.init);
            //default value for orderProp
            scope.orderProp = 'age';
            //to make the toggle Arrow

            scope.toggleArrows = function (index) {
                console.log(index);

                var snippet = scope.entries[index];
                console.log(snippet);
                if (scope.entries[index].showSnippet != undefined) {
                    console.log('has snippet');
                    scope.entries[index].showSnippet = !scope.entries[index].showSnippet;
                }
                else {
                    console.log('has no snippet');
                    scope.entries[index].showSnippet = true;
                }
            }
        }
    };
}]);


Videbligo.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});
