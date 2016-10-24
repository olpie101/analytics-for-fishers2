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
                        'SUM(num_items__c) items, '+
                        'SUM(weight_kg__c) weight, '+
                        'SUM(num_crates__c) crates '+
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

            const lastNTripDates = function (nummberOfDays) {
                var query = 'SELECT id FROM Ablb_Fisher_Trip__c ORDER BY trip_date__c DESC LIMIT '+nummberOfDays;
                return force.query(query);
            }

            const lastNTripCatches = function(nummberOfDays){
                return lastNTripDates(nummberOfDays)
                    .then(handleDateResponses);

                 function handleDateResponses(result){
                     var queryList = result.records.map(record => "'"+record.Id+"'").join(',');
                     console.log(queryList);
                     var query = "SELECT parent_trip__r.trip_date__c date, "+
                     "parent_trip__r.lkup_landing_site__r.name_eng__c site, "+ //site doesn't alias but is needed to remove abiguity
                     "lkup_species__r.name_eng__c species, SUM(num_items__c) items, "+
                     "SUM(weight_kg__c) weight, SUM(num_crates__c) crates "+
                     "FROM Ablb_Fisher_Catch__c "+
                     "WHERE parent_trip__c IN ("+queryList+") "+
                     "GROUP BY parent_trip__r.trip_date__c, "+
                     "parent_trip__r.lkup_landing_site__r.name_eng__c, lkup_species__r.name_eng__c "+
                     "ORDER BY parent_trip__r.trip_date__c DESC NULLS LAST";

                     return force.query(query);
                 }
            }

            return {
                queryCatchByTimePeriod: queryCatchByTimePeriod,
                lastNTripCatches: lastNTripCatches
            };
        });
})();
