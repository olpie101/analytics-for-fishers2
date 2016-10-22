(function() {
    'use strict';
    angular.module('utilsModule')
    .service('ResultsUtil', function() {
        return {
            // Applies a threshold on each entry by filtering any entry with a
            // total less than the percentage threshold provided when compared to
            // the entry with the maximum total
            // Also removes from each record any variable with a value of zero
            applyMapThreshold: function (data, threshold) {
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
            },
        }
    });
})();
