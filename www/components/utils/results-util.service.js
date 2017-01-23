(function() {
    'use strict';
    angular.module('utilsModule')
    .service('ResultsUtil', function() {
        function getYear(value){
            value = value.toString();
            return parseInt(value.split("-")[0]);
        }

        function getMonth(value){
            return parseInt(value.split("-")[1]);
        }

        function getWeek(value){
            return parseInt(value.split("-w")[1]);
        }

        function compareNumbers(value1, value2){
            if (value1 > value2){
                return 1;
            }else if (value1 < value2) {
                return -1;
            }else{
                return 0;
            }
        }

        const dateComparator = function(a, b, accessor) {
            accessor = (typeof accessor !== 'number')? accessor: null
            if((accessor == null && a < b) || a[accessor] < b[accessor]){
                return -1;
            }

            if((accessor == null && a > b) || a[accessor] > b[accessor]){
                return 1;
            }
            return 0;
        }

        // Applies a threshold on each entry by filtering any entry with a
        // total less than the percentage threshold provided when compared to
        // the entry with the maximum total
        // Also removes from each record any variable with a value of zero
        const applyMapThreshold = function (data, threshold) {
            var values = data.map(record => d3.values(record).slice(1));
            var max = d3.max(values, arr => d3.sum(arr));

            return data.filter(record => {
                var recordSum = d3.sum(d3.values(record).slice(1));
                return recordSum >= threshold*max;
            })
            .map(record => {
                Object.getOwnPropertyNames(record)
                    .forEach(property => {
                        if(typeof record[property] === 'number' && record[property] <= 0){
                            delete record[property];
                        }
                    });
                return record;
            });
        }

        // comparator to sort by year, month or week
        const sortByInterval = function (method, value1, value2) {
            switch (method.toLowerCase()) {
                case 'yearly':
                    return compareNumbers(getYear(value1.key), getYear(value2.key));
                case 'monthly':
                    var month1 = getMonth(value1.key);
                    var month2 = getMonth(value2.key);
                    var year1 = getYear(value1.key);
                    var year2 = getYear(value2.key);

                    if (year1 != year2){
                        return compareNumbers(year1, year2);
                    } else {
                        return compareNumbers(month1, month2);
                    }
                case 'weekly':
                    var week1 = getWeek(value1.key);
                    var week2 = getWeek(value2.key);
                    var year1 = getYear(value1.key);
                    var year2 = getYear(value2.key);

                    if (year1 != year2){
                        return compareNumbers(year1, year2);
                    } else {
                        return compareNumbers(week1, week2);
                    }
                default: return 0;
            }
        }

        return {
            applyMapThreshold: applyMapThreshold,
            sortByInterval: sortByInterval,
            dateComparator: dateComparator,
        }
    });
})();
