(function(){
    'use strict';
    const catchByTimePeriodController = function CatchByTimePeriodController(force, sfdata, ResultsUtil, refreshBus){
        const ctrl = this;
        var responseData;
        ctrl.intervals = sfdata.TIME_INTERVALS;
        ctrl.methods = sfdata.QUANTITY_AGGREGATION_TYPES;
        ctrl.selectedCalculationMethod = ctrl.methods[0];
        ctrl.selectedInterval = ctrl.intervals[1];
        ctrl.loading = false;

        ctrl.$onInit = function() {
            refreshBus.observable()
                .filter(evt => evt)
                .subscribe(evt => requestData());
            refreshBus.post(null);
        }

        function requestData(){
            console.log("req data");
            ctrl.loading = true;
            sfdata.queryCatchByTimePeriod(ctrl.selectedInterval)
                    .then(handlerResponse, showError);
        }

        const handlerResponse = function(result){
            responseData = result.records;
            refreshBus.post(false);
            ctrl.loading = false;
            updateData();
        }

        ctrl.intervalChange = function(selection) {
            requestData();
        }

        ctrl.calculationMethodChange = function(selection){
            updateData();
        }

        function updateData(){
            Rx.Observable.from(responseData)
                .groupBy(record => sfdata.groupByInterval(ctrl.selectedInterval, record))
                .flatMap(aggregateSpecies)
                .toArray()
                .map(data => data.sort((a, b) => ResultsUtil.sortByInterval(ctrl.selectedInterval, a, b)))
                .map(data => data.slice(0, 12))
                // .map(data => ResultsUtil.applyMapThreshold(data, 0.001))
                .subscribe(data => {
                    ctrl.dataMap = data;
                    ctrl.xTitle = getXTitle(ctrl.selectedInterval);
                    ctrl.yTitle = getYTitle(ctrl.selectedCalculationMethod);
                });
        }

        function getYTitle(method) {
            switch(method.toLowerCase()){
                case 'items':
                    return "Quantity";
                case 'weight':
                    return "Weight (kg)";
                case 'crates':
                    return "Quantity (crates)";
                default: break;
            }
        }

        function getXTitle(method) {
            switch(method.toLowerCase()){
                case 'yearly':
                    return "Year";
                case 'monthly':
                    return "Month";
                case 'weekly':
                    return "Week";
                default: break;
            }
        }

        function aggregateSpecies(monthObs) {
            var records = new Map();

            return monthObs
                .reduce(collectTotal, records)
                .map(summedRecords => {
                    return createRecord(monthObs.key, summedRecords);
                });
        }

        function collectTotal(acc, entry){
            acc.set(entry.species, entry[ctrl.selectedCalculationMethod.toLowerCase()]);
            return acc;
        }

        function createRecord(key, totals){
            var rec = {key: key};
            totals.forEach((v, k) => rec[k] = v);
            return rec;
        }

        var showError = function(err) {
            ctrl.loading = false;
        }
    }

    angular.module('catchByTimePeriodModule')
            .component('catchByTimePeriod',{
                templateUrl: 'components/catch-by-time-period/catch-by-time-period.template.html',
                controller: catchByTimePeriodController
            });
})();
