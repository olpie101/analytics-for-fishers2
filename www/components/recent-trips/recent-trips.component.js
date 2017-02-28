(function() {
    'use strict';
    var recentTripsController = function RecentTripsController(force, sfdata, refreshBus, StringUtil){
        var ctrl = this;
        ctrl.loading = false;
        var responseData;
        const NUMBER_OF_RECENT_TRIPS = 10;

        ctrl.$onInit = function() {
            refreshBus.observable()
                .filter(evt => evt)
                .subscribe(evt => requestData());
            refreshBus.post(null);
        }

        function requestData() {
            ctrl.loading = true;
            sfdata.lastNTripCatches(NUMBER_OF_RECENT_TRIPS)
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
            updateLandingSiteIfNecessary(acc, entry);
            var record = {key:entry.species, value:getEntryValue(entry)}
            acc.speciesInfo.push(record);
            return acc;
        }

        function updateLandingSiteIfNecessary(acc, entry){
            if(typeof acc.site === 'undefined' || acc.site == "Unknown"){
                if((typeof entry.site === 'undefined' || entry.site == null) &&
                 (typeof entry.site_back_up === 'undefined' || entry.site_back_up == null)){
                    acc.site = "Unknown";
                } else if (typeof entry.site !== 'undefined' && entry.site != null) {
                    acc.site = entry.site.substring(entry.site.indexOf('-')+1);
                } else if (typeof entry.site_back_up !== 'undefined' || entry.site_back_up != null) {
                    acc.site = StringUtil.capitalise(entry.site_back_up.substring(0, entry.site_back_up.indexOf('_')));
                }
            }
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
            ctrl.loading = false;
            responseData = result.records;
            refreshBus.post(false);
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
            controller: recentTripsController,
        })
})();
