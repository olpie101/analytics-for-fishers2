(function(){
    'use strict';
    const catchByTimePeriodController = function CatchByTimePeriodController(force, sfdata, $window){
        const ctrl = this;
        var responseData;
        var selectedMonth;
        var selectedCalculationMethod;
        var selectedCalculationMethodIndex = 0;
        var calculationSelectionKeys = ["weight_total", "numbers_total"];
        var renderGraph = true;
        ctrl.selected = ["2015", "8"];
        ctrl.months = [];

        ctrl.$onInit = function() {
            console.log("#### catch by time period init");
            // ctrl.months = ["hello", "goodbye"];
            sfdata.queryCatchByTimePeriod()
                    .then(handlerResponse);
        }

        const handlerResponse = function(result){
            responseData = result.records;
            ctrl.months = responseData.map(record => record.year+" "+record.month);

            if(ctrl.months.length > 0){
                ctrl.selected = ctrl.months[0];
                ctrl.monthChange(ctrl.months[0]);
            }
            updateData();
        }

        //month selection has been changed
        ctrl.monthChange = function(selection) {
            selectedMonth = selection.split(" ");
            updateData();
        }

        function updateData(){
            if(renderGraph == false){
                return;
            }

            Rx.Observable.from(responseData)
                // .filter(info => info.month == selectedMonth)
                // .filter(info => info.landing_site__c == selectedLocation.toLowerCase().replace(' ', '_'))
                .groupBy(info => info.year+" "+info.month)
                .flatMap(aggregateSpecies)
                .toArray()
                // .map(data => ResultsUtil.applyMapThreshold(data, 0.001))
                // .map(list => list.sort((a, b) => SpeciesUtil.speciesComparator(a, b, "key")))
                .subscribe(data => {
                    console.log("subscribed");
                    console.log(data);
                    ctrl.dataMap = data;
                    ctrl.xTitle = "Species";
                    ctrl.yTitle = "Quantity";
                });
        }

        function aggregateSpecies(speciesObs) {
            var records = new Map();

            return speciesObs
                .reduce(collectTotal, records)
                .map(summedRecords => {
                    return createRecord(speciesObs.key, summedRecords);
                });
        }

        function collectTotal(acc, entry){
            acc.set(entry.species, entry.items);
            return acc;
        }

        function createRecord(key, totals){
            var rec = {key: key};
            totals.forEach((v, k) => rec[k] = v);
            return rec;
        }

        var showError = function(err) {
            console.log("error occured");
            console.log(err);
        }
    }

    angular.module('catchByTimePeriodModule')
            .component('catchByTimePeriod',{
                templateUrl: 'components/catch-by-time-period/catch-by-time-period.template.html',
                controller: catchByTimePeriodController
            });
})();
