(function() {
    "use strict";

    const expensesIncomeReportController = function ExpensesIncomeReportController(sfdata,
         refreshBus, userservice, $state, ResultsUtil) {
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
        ctrl.isManager = false;
        ctrl.fisherList = sfdata.BASE_FISHER_LIST;
        ctrl.selectedFisher = null;

        ctrl.$onInit = function(){
            refreshBus.observable()
                .filter(evt => evt)
                .subscribe(evt => requestData());
            refreshBus.post(null);
            ctrl.isManager = userservice.userType() == "fisher_manager";
        }

        function requestData(){
            ctrl.loading = true;
            sfdata.queryExpensesIncomeByTimePeriod(ctrl.selectedInterval,
                ((ctrl.selectedFisher)|| ctrl.fisherList[0]).lkup_main_fisher_id__c)
                .then(handlerResponse, showError);
        }

        const handleFisherListResponse = function (fList) {
            if(ctrl.isManager){
                fList.toArray()
                .filter(fList => ctrl.selectedFisher == null)
                .subscribe(fList => {
                    ctrl.fisherList = sfdata.BASE_FISHER_LIST.concat(fList);
                    ctrl.selectedFisher = ctrl.fisherList[0];
                    ctrl.fisherChange(ctrl.selectedFisher);
                });
            }
        }

        const handlerResponse = function(result){
            console.log("handling e/i response");
            expensesResponseDataObs = result[0];
            incomeResponseDataObs = result[1];
            handleFisherListResponse(result[2]);
            refreshBus.post(false);
            ctrl.loading = false;
            collectMonths(expensesResponseDataObs, incomeResponseDataObs);
        }

        ctrl.fisherChange = function (selection) {
            ctrl.selectedFisher = selection;
            requestData();
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

            expMonths.concat(incMonths)
                .toArray()
                .map(months => new Set(months).values())
                .map(monthSetIterable => Array.from(monthSetIterable))
                .flatMap( arr => Rx.Observable.from(arr))
                .map( x => convertToDate(x))
                .toArray()
                .map(months => months.sort(ResultsUtil.dateComparator))
                .map(months => months.reverse())
                .map(months => months.map(convertToDateString))``
                .subscribe(months => {
                    ctrl.months = months;
                    var index = ctrl.months.indexOf(ctrl.selectedMonth);
                    if(index < 0) { index = 0; }
                    ctrl.selectedMonth = ctrl.months[index];
                    ctrl.monthChange(ctrl.selectedMonth);
                });
        }

        function updateData(){
            var formattedExpense = expensesResponseDataObs
                    .filter(record => sfdata.groupByInterval(ctrl.selectedInterval, record) == ctrl.selectedMonth.replace("-0", "-"))
                    .doOnNext(record => {
                        record['total'] = Object.keys(record)
                                .filter(prop => prop.startsWith("cost_"))
                                .reduce((tot, prop) => tot + (record[prop] || 0), 0);
                    })
                    .defaultIfEmpty({total:"N/A"});

            var formattedIncome = incomeResponseDataObs
                    .filter(record => record.key == ctrl.selectedMonth.replace("-0", "-"));

            Rx.Observable.concat(formattedExpense, formattedIncome)
                .toArray()
                .subscribe(data => {
                    ctrl.expenses = data[0];
                    ctrl.income = data[1];
                    $state.reload();
                });
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

            var otherPrices = priceProps
                    .filter(prop => prop != "price_batch")
                    .reduce((tot, prop) =>{
                        var propId = "sold_"+prop.split('_')[1]; //Gets the type (ie. crates, items, weight)
                        var value = (entry[prop] || 0)*(entry[propId] || 0);
                        return tot+value
                    }, 0);
            return acc+batchPrice+otherPrices;
        }

        const convertToDate = function(dateString) {
            var yearMonth = dateString.split('-');
            var tempDate = new Date(yearMonth[0], yearMonth[1]-1, 1);
            return tempDate;
        }

        const convertToDateString = function(date) {
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            if(month < 10){
                month = "0"+month;
            }
            return year+"-"+month;
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
