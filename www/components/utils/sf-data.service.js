(function() {
    'use strict';

    angular.module('utilsModule')
        .factory('sfdata', function(force){
            const queryCatchByTimePeriod = function(interval){
                interval = interval.toLowerCase();
                var query = 'SELECT '

                switch (interval) {
                    case 'yearly':
                        query += 'CALENDAR_YEAR(parent_trip__r.odk_date__c) year ';
                        break;
                    case 'monthly':
                        query += 'CALENDAR_YEAR(parent_trip__r.odk_date__c) year, '+
                        'CALENDAR_MONTH(parent_trip__r.odk_date__c) month ';
                        break;
                    case 'weekly':
                        query += 'CALENDAR_YEAR(parent_trip__r.odk_date__c) year, '+
                        'CALENDAR_MONTH(parent_trip__r.odk_date__c) month, '+
                        'WEEK_IN_YEAR(parent_trip__r.odk_date__c) week ';
                        break;
                    default: break;
                }

                query += ', lkup_species__r.name_eng__c species, '+
                        'SUM(num_items__c) items '+
                        'FROM Ablb_Fisher_Catch__c ';

                switch (interval) {
                    case 'yearly':
                        query += 'GROUP BY CALENDAR_YEAR(parent_trip__r.odk_date__c) ';
                        break;
                    case 'monthly':
                        query += 'GROUP BY CALENDAR_YEAR(parent_trip__r.odk_date__c), '+
                            'CALENDAR_MONTH(parent_trip__r.odk_date__c) ';
                        break;
                    case 'weekly':
                        query += 'GROUP BY CALENDAR_YEAR(parent_trip__r.odk_date__c), '+
                            'CALENDAR_MONTH(parent_trip__r.odk_date__c), '+
                            'WEEK_IN_YEAR(parent_trip__r.odk_date__c) ';
                        break;
                    default: break;
                }

                query += ', lkup_species__r.name_eng__c';

                console.log("Interval Query:\n"+query);

                return force.query(query);
            }

            return {
                queryCatchByTimePeriod: queryCatchByTimePeriod
            };
        });
})();
