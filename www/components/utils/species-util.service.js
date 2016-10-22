(function() {
    'use strict';
    
    angular.module('utilsModule')
        .service('SpeciesUtil', function() {
            return {
                // Capitalises each specie name and replaces 'not_on_list' with 'Other'
                cleanAndCapitalise: function (info, accessor) {
                    accessor = (typeof accessor !== 'number')? accessor: 'species__c';
                    if (info[accessor] == "not_on_list"){
                        info[accessor] = "Other";
                    } else {
                        info[accessor] = info[accessor].substring(0,1).toUpperCase()+info[accessor].substring(1);
                    }
                    return info;
                },

                // Sorts the items according to species pushing "Other"
                // to the end of the list
                speciesComparator: function (a, b, accessor = 'species__c') {
                    accessor = (typeof accessor !== 'number')? accessor: 'species__c';
                    if(a[accessor] == "Other") {
                        return 1;
                    }else if(b[accessor] == "Other"){
                        return -1;
                    }else if (a[accessor] > b[accessor]) {
                        return 1;
                    }else if (a[accessor] < b[accessor]) {
                        return -1;
                    }
                    return 0;
                },

                //TODO doesn't actually belong here, didn't want to create a new service for 1 method
                // truncates the date received from DB response to monthly precision
                truncDateToMonth: function (info) {
                    info.month = info.year_month.substring(0, 7);
                    return info;
                }
            }
        });
})();
