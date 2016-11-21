(function(){
    'use strict';
    const catchByTimePeriodController = function CatchByTimePeriodController(force, sfdata,
        ResultsUtil, refreshBus, userservice, $state){
        const ctrl = this;
        var responseObs;
        ctrl.intervals = sfdata.TIME_INTERVALS;
        ctrl.methods = sfdata.QUANTITY_AGGREGATION_TYPES;
        ctrl.selectedCalculationMethod = ctrl.methods[0];
        ctrl.selectedInterval = ctrl.intervals[1];
        ctrl.loading = false;
        ctrl.isManager = false;
        var baseFisherList = [{
            lkup_main_fisher_id__c:"All",
            lkup_main_fisher_id__r: {
                Name: "All"
            }
        }];
        ctrl.fisherList = baseFisherList;
        ctrl.selectedFisher = null;

        ctrl.$onInit = function() {
            refreshBus.observable()
                .filter(evt => evt)
                .subscribe(evt => requestData());
            refreshBus.post(null);
            ctrl.isManager = userservice.userType() == "fisher_manager";
        }

        function requestData(){
            sfdata.queryCatchByTimePeriod(ctrl.selectedInterval,
                ((ctrl.selectedFisher)|| ctrl.fisherList[0]).lkup_main_fisher_id__c)
                    .then(handlerResponse, showError);
        }

        const handleFisherListResponse = function (fList) {
            fList.toArray()
                .filter(fList => ctrl.selectedFisher == null)
                .subscribe(fList => {
                    ctrl.fisherList = baseFisherList.concat(fList);
                    ctrl.selectedFisher = ctrl.fisherList[0];
                    ctrl.fisherChange(ctrl.selectedFisher);
                });
        }

        const handlerResponse = function(result){
            responseObs = result[0];

            if(ctrl.isManager){
                handleFisherListResponse(result[1]);
            }

            refreshBus.post(false);
            ctrl.loading = false;
            updateData();
        }

        ctrl.fisherChange = function (selection) {
            requestData();
        }

        ctrl.intervalChange = function(selection) {
            requestData();
        }

        ctrl.calculationMethodChange = function(selection){
            updateData();
        }

        function updateData(){
            responseObs
                .groupBy(record => sfdata.groupByInterval(ctrl.selectedInterval, record))
                .flatMap(aggregateSpecies)
                .toArray()
                .map(data => data.sort((a, b) => ResultsUtil.sortByInterval(ctrl.selectedInterval, a, b)))
                .map(data => data.slice(0, 12))
                .subscribe(data => {
                    ctrl.dataMap = data;
                    ctrl.xTitle = getXTitle(ctrl.selectedInterval);
                    ctrl.yTitle = getYTitle(ctrl.selectedCalculationMethod);
                    $state.reload(); //Fixes reloading issues
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
            refreshBus.post(false);
        }
    }

    angular.module('catchByTimePeriodModule')
            .component('catchByTimePeriod',{
                templateUrl: 'components/catch-by-time-period/catch-by-time-period.template.html',
                controller: catchByTimePeriodController
            });
})();
