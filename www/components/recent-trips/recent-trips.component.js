(function() {
    'use strict';
    var recentTripsController = function RecentTripsController(force, sfdata){
        var ctrl = this;
        ctrl.loading = false;
        var responseData;
        const NUMBER_OF_RECENT_TRIPS = 10;

        ctrl.$onInit = function() {
            ctrl.loading = true;
            var q = sfdata.lastNTripCatches(NUMBER_OF_RECENT_TRIPS)
                        .then(handleResponse, showError);
        }

        function updateData(){
            Rx.Observable.from(responseData)
                .groupBy(record => record.date)
                .flatMap(aggregateInfo)
                .toArray()
                .subscribe(data => {
                    ctrl.trips = data;
                });
        }

        function aggregateInfo(tripObs) {
            var records = new Object();
            records.speciesInfo = [];

            return tripObs
                .reduce(collectTotal, records)
                .map(summedRecords => {
                    return createRecord(tripObs.key, summedRecords);
                });
        }

        function collectTotal(acc, entry){
            if(typeof acc.site === 'undefined'){
                acc.site = entry.site.substring(entry.site.indexOf('-')+1);
            }
            acc.speciesInfo.push({key:entry.species, value:getEntryValue(entry)});
            return acc;
        }

        function createRecord(key, totals){
            var rec = {key: key};
            rec['speciesInfo'] = totals.speciesInfo;
            rec['site'] = totals.site;
            return rec;
        }

        function getEntryValue(entry){
            if(entry.weight != null){
                return entry.weight+" kg";
            } else if (entry.items != null) {
                return entry.items+" units";
            } else if (entry.crates != null) {
                return entry.crates+" crates";
            } else{
                return "N/A";
            }
        }

        var handleResponse = function(result){
            console.log("result");
            console.log(result);
            ctrl.loading = false;
            responseData = result.records;
            updateData();
        }

        var showError = function(err) {
            console.log("error occured");
            console.log(err);
            ctrl.loading = false;
        }
    }

    angular.module('recentTripsModule')
        .component('recentTrips', {
            templateUrl: 'components/recent-trips/recent-trips.template.html',
            controller: recentTripsController
        })
})();
