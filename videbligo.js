var Videbligo = angular.module('Videbligo', ['angularUtils.directives.dirPagination']);

Videbligo.service('MetadataService', ["$rootScope", "$location", "$http", "$timeout", function ($rootScope, $location, $http, $timeout) {
    var crossData = null;
    var all = null;
    var initCallbacks = [];
    this.init = function () {
        $http({
            method: 'GET',
            url: "./assets/dist/data.json"
        }).success(function (data) {
            crossData = crossfilter(data);
            all = crossData.groupAll();
            initCallbacks.forEach(function (callback) {
                callback();
            })
            $rootScope.$broadcast('filterChanged');
        }).error(function (data) {
            console.log("Request failed");
        });
    };
    this.init();

    this.registerWidget = function (initCallback) {
        if(crossData == null) {
            initCallbacks.push(initCallback);
        } else {
            initCallback();
        }
    }

    this.getData = function () {
        return crossData;
    }

    this.triggerUpdate = function () {
        $timeout(function() {$rootScope.$broadcast('filterChanged');}, 0);
    }

    this.length = function () {
        return all.value();
    }

}]);

function parseDate(input) {
    if (input == undefined) {
        return undefined;
    }

    var parts = input.split('-');
    return new Date(parts[0], parts[1]-1, parts[2]); // Note: months are 0-based
}


/*  This class is used in widgets to collect selected values for the filtering */
function StringSet() {
    var setObj = {}, val = {};

    this.toggle = function (str){
        if(this.contains(str)){
            this.remove(str);
        } else{
            this.add(str);
        }
    };

    this.add = function(str) {
        setObj[str] = val;
    };

    this.contains = function(str) {
        return setObj[str] === val;
    };

    this.remove = function(str) {
        delete setObj[str];
    };

    this.values = function() {
        var values = [];
        for (var i in setObj) {
            if (setObj[i] === val) {
                values.push(i);
            }
        }
        return values;
    };

    this.clear = function(){
        setObj = {};
    }
}

/* this maps from the ids found in the dataset to human friendly Names */
var category_mapping = {
    'arbeit':        'Arbeitsmarkt',
    'bildung':       'Bildung',
    'demographie':   'Demographie',
    'geo':           'Geographie und Stadtplanung',
    'gesundheit':    'Gesundheit',
    'jugend':        'Jugend',
    'kultur':        'Kunst und Kultur',
    'sicherheit':    'Öffentliche Sicherheit',
    'verwaltung':    'Öffentliche Verwaltung, Haushalt und Steuern',
    'protokolle':    'Protokolle und Beschlüsse',
    'erholung':      'Sport und Erholung',
    'tourismus':     'Tourismus',
    'verentsorgung': 'Ver- und Entsorgung',
    'verkehr':       'Verkehr',
    'wahl':          'Wahlen',
    'wirtschaft':    'Wirtschaft',
    'wohnen':        'Wohnen und Immobilien',
    'sonstiges':     'Sonstiges',
    'sozial':        'Sozialleistungen',

    /* mapping is not one-to-one (just one dataset, maybe a bug) */
    /* http://daten.berlin.de/datensaetze/wlan-standorte-berlin */
    'oeffentlich':   'Sonstiges'

    /* categories, that are not in use and therefor have no mapping right now
    '': 'Transport und Verkehr',
    '': 'Umwelt und Klima',
    '': 'Verbraucherschutz'
    */
};

/* this mapping contains all used licences, corresponding icons and a link to the full text */
var licence_mapping = {
    'cc-by':        ['Creative Commons Namensnennung',                         'assets/icons/licence/cc-by.png',        'https://creativecommons.org/licenses/by/3.0/de/'],
    'cc-by-sa':     ['Creative Commons Weitergabe unter gleichen Bedingungen', 'assets/icons/licence/cc-by-sa.png',     'https://creativecommons.org/licenses/by-sa/3.0/de/'],
    'other-closed': ['Keine Freie Lizenz, siehe Website des Datensatzes',      'assets/icons/licence/other-closed.png', ''],
    'odc-odbl':     ['Open Data Commons Open Database License',                'assets/icons/licence/odc-odbl.png',     'http://opendefinition.org/licenses/odc-odbl/'],
    'cc-nc':        ['Creative Commons Namensnennung-Nicht-kommerziell',       'assets/icons/licence/cc-nc.png',        'https://creativecommons.org/licenses/by-nc/3.0/de/'],
    'gfdl':         ['GNU-Lizenz für freie Dokumentation',                     'assets/icons/licence/gfdl.png',         'https://www.gnu.org/copyleft/fdl.html']
}

/* this has to correspond with the ids in the svg */
var regionsAll = [
    'Berlin',
    'Berlin-Mitte',
    'Charlottenburg-Wilmersdorf',
    'Friedrichshain-Kreuzberg',
    'Lichtenberg',
    'Marzahn-Hellersdorf',
    'Neukölln',
    'Pankow',
    'Reinickendorf',
    'Spandau',
    'Steglitz-Zehlendorf',
    'Tempelhof-Schöneberg',
    'Treptow-Köpenick' ];


function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

var germanLocale = d3.locale({
    "decimal": ".",
    "thousands": ",",
    "grouping": [3],
    "currency": ["€", ""],
    "dateTime": "%a %b %e %X %Y",
    "date": "%d/%m/%Y",
    "time": "%H:%M:%S",
    "periods": ["AM", "PM"],
    "days": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    "shortDays": ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    "months": ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    "shortMonths": ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
});

