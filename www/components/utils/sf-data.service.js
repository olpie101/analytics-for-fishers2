(function() {
    'use strict';

    angular.module('utilsModule')
        .factory('sfdata', function(force){
            const queryCatchByTimePeriod = function(){
                console.log("query service called");
                return force.query('SELECT CALENDAR_YEAR(parent_trip__r.odk_date__c) year, CALENDAR_MONTH(parent_trip__r.odk_date__c) month,lkup_species__r.name_eng__c species, SUM(num_items__c) items FROM Ablb_Fisher_Catch__c GROUP BY CALENDAR_YEAR(parent_trip__r.odk_date__c), CALENDAR_MONTH(parent_trip__r.odk_date__c), lkup_species__r.name_eng__c');
            }

            return {
                queryCatchByTimePeriod: queryCatchByTimePeriod
            };
        });
})();
