(function() {
    "use strict";

    const expensesIncomeReportController = function ExpensesIncomeReportController(sfdata, refreshBus) {
        var ctrl = this;
        ctrl.loading = false;
        ctrl.intervals = sfdata.TIME_INTERVALS.slice(1, 2);
        ctrl.selectedInterval = ctrl.intervals[0];
        ctrl.months = [];
        ctrl.selectedMonth;
        ctrl.expenses;
        ctrl.income;
        ctrl.isNumber = (number) => typeof number === "number";
        var selectedMonthSet = false;
        var expensesResponseDataObs;
        var incomeResponseDataObs;

        ctrl.$onInit = function(){
            refreshBus.observable()
                .filter(evt => evt)
                .subscribe(evt => requestData());
            refreshBus.post(null);
        }

        function requestData(){
            console.log("requesting data");
            ctrl.loading = true;
            sfdata.queryExpensesIncomeByTimePeriod(ctrl.selectedInterval)
                    .then(handlerResponse, showError);
        }

        const handlerResponse = function(result){
            console.log("handling e/i response");
            console.log(result);
            expensesResponseDataObs = result[0];
            incomeResponseDataObs = result[1];
            refreshBus.post(false);
            ctrl.loading = false;
            collectMonths(expensesResponseDataObs, incomeResponseDataObs);
        }

        ctrl.intervalChange = function(selection) {
            requestData();
        }

        ctrl.monthChange = function(selection){
            updateData();
        }

        function collectMonths(expensesObs, incomeObs) {
            var expMonths = expensesObs.map(record => sfdata.groupByInterval(ctrl.selectedInterval, record));

            var incMonths = incomeObs.map(record => record.key);

            expMonths.concat(expMonths, incMonths)
                .toArray()
                .map(months => new Set(months).values())
                .map(monthSetIterable => Array.from(monthSetIterable))
                .subscribe(months => {
                    ctrl.months = months;
                    console.log("###months found");
                    console.log(months);
                    if(!selectedMonthSet){
                        ctrl.selectedMonth = ctrl.months[0];
                        selectedMonthSet = true;
                        ctrl.monthChange(ctrl.selectedMonth);
                    }
                });
        }

        function updateData(){
            console.log("updating data");
            expensesResponseDataObs
                    .filter(record => sfdata.groupByInterval(ctrl.selectedInterval, record) == ctrl.selectedMonth)
                    .doOnNext(record => {
                        record['total'] = Object.keys(record)
                                .filter(prop => prop.startsWith("cost_"))
                                .reduce((tot, prop) => tot + (record[prop] || 0), 0);
                    })
                    .defaultIfEmpty({total:"N/A"})
                    .subscribe(item => {ctrl.expenses = item; console.log("###expenses");console.log(ctrl.expenses);console.log("###expenses end");});

            incomeResponseDataObs
                    .filter(record => record.key == ctrl.selectedMonth)
                    .subscribe(item => {ctrl.income = item; console.log("###income");console.log(ctrl.income);} )

            //TODO zip expenses and income

            // Rx.Observable.from(responseData)
            //     .groupBy(record => sfdata.groupByInterval(ctrl.selectedInterval, record))
            //     .flatMap(aggregateSpecies)
            //     .toArray()
            //     .map(data => data.sort((a, b) => ResultsUtil.sortByInterval(ctrl.selectedInterval, a, b)))
            //     .map(data => data.slice(0, 12))
            //     // .map(data => ResultsUtil.applyMapThreshold(data, 0.001))
            //     .subscribe(data => {
            //         ctrl.dataMap = data;
            //         ctrl.xTitle = getXTitle(ctrl.selectedInterval);
            //         ctrl.yTitle = getYTitle(ctrl.selectedCalculationMethod);
            //     });
        }

        const collectExpensesTotals = function(acc, entry){
            console.log("agg expenses => "+acc);
            console.log(entry);
            var total = Object.keys(entry)
                    .filter(prop => prop.startsWith("cost_"))
                    .reduce((tot, prop) => tot + (entry[prop] || 0), 0);
            return acc + total;
        }

        const collectIncomeTotals = function(acc, entry) {
            var priceProps = Object.keys(entry)
                .filter(prop => prop.startsWith("price_"))

            var batchPrice = priceProps
                    .filter(prop => prop == "price_batch")
                    .map(prop => entry[prop] || 0);

            console.log("###geting other prices");
            var otherPrices = priceProps
                    .filter(prop => prop != "price_batch")
                    .reduce((tot, prop) =>{
                        var propId = "sold_"+prop.split('_')[1]; //Gets the type (ie. crates, items, weight)
                        console.log("propId => "+propId);
                        console.log(entry[propId]);
                        console.log("prop => "+prop);
                        console.log(entry[prop]);
                        var value = (entry[prop] || 0)*(entry[propId] || 0);
                        console.log("value =>"+value);
                        return tot+value
                    }, 0);
            return acc+batchPrice+otherPrices;
        }

        const showError = function(err) {
            console.log("error");
            ctrl.loading = false;
            refreshBus.post(false);
        }
    }

    angular.module('expensesIncomeReportModule', [])
        .component('expensesIncomeReport', {
            templateUrl: 'components/expenses-income-report/expenses-income-report.template.html',
            controller: expensesIncomeReportController,
        })
})();
