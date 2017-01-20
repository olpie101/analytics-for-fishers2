(function(){
    'use strict';
    const catchByTimePeriodController = function CatchByTimePeriodController(force, sfdata,
        ResultsUtil, refreshBus, userservice, $state){
        const ctrl = this;
        var responseObs;
        ctrl.methods = ["Batch"].concat(sfdata.QUANTITY_AGGREGATION_TYPES);
        ctrl.selectedCalculationMethod = ctrl.methods[0];
        ctrl.isCoop = false;
        ctrl.loading = false;
        ctrl.isManager = false;
        ctrl.fisherList = sfdata.BASE_FISHER_LIST;
        ctrl.selectedFisher = null;
        ctrl.data = [];
        ctrl.xTitle = "Month";
        ctrl.yTitle = "TODO change this";

        ctrl.$onInit = function() {
            refreshBus.observable()
                .filter(evt => evt)
                .subscribe(evt => requestData());
            refreshBus.post(null);
            // ctrl.isManager = userservice.userType() == "fisher_manager";
        }

        function requestData(){
            //TODO add necessary methods
            sfdata.queryEvolutionOfPrices(ctrl.selectedCalculationMethod, "")
                    .then(handlerResponse, showError);
        }

        const handleFisherListResponse = function (fList) {
            fList.toArray()
                .filter(fList => ctrl.selectedFisher == null)
                .subscribe(fList => {
                    ctrl.fisherList = sfdata.BASE_FISHER_LIST.concat(fList);
                    ctrl.selectedFisher = ctrl.fisherList[0];
                    ctrl.fisherChange(ctrl.selectedFisher);
                });
        }

        const handlerResponse = function(result){
            console.log("handling response");
            responseObs = result;

            // if(ctrl.isManager){
            //     handleFisherListResponse(result[1]);
            // }

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

        ctrl.calculationToggleChange = function(selection){
            ctrl.isCoop = selection;
            updateData();
        }

        ctrl.calculationMethodChange = function(selection){
            updateData();
        }

        function updateData(){
            var method = ctrl.selectedCalculationMethod;
            var personalOrCooop = ctrl.isCoop;
            responseObs
                .filter(rec => filterByCalcMethod(method, personalOrCooop, rec))
                .map(rec => { return {"date": new Date(rec.year, rec.month, 1), "species": rec.Name, "value":getEvoVal(method, personalOrCooop, rec)}})
                .groupBy(record => record.species)
                .flatMap(o => o.toArray())
                .map( list => list.sort(dateComparator))
                .toArray()
                .subscribe(rec => {
                    ctrl.data = rec;
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

        var showError = function(err) {
            ctrl.loading = false;
            refreshBus.post(false);
        }

        const convertPriceCalcMethodToVar = function (method, personalOrCooop){
            var prefix = "price_";
            if(personalOrCooop){
                prefix = "coop_price_";
            }
            var filterMethod = ""
            switch(method.toLowerCase()){
                case 'batch':
                    filterMethod = "batch";
                    break;
                case 'items':
                    filterMethod = "item";
                    break;
                case 'weight':
                    filterMethod = "kg";
                    break;
                case 'crates':
                    filterMethod = "crate";
                    break;
                default:
                    filterMethod = "batch";
            }

            return prefix+filterMethod;
        }

        const filterByCalcMethod = function (method, personalOrCooop, record) {
            var filterMethod = convertPriceCalcMethodToVar(method, personalOrCooop);
            return (record[filterMethod])? true : false
        }

        const getEvoVal = function (method, personalOrCooop, record) {
            var filterMethod = convertPriceCalcMethodToVar(method, personalOrCooop);
            return record[filterMethod];
        }

        const dateComparator = function(a, b) {
            if(a.date < b.date){
                return -1;
            }

            if(a.date > b.date){
                return 1;
            }
            return 0;
        }
    }

    angular.module('evolutionOfPricesModule')
            .component('evolutionOfPrices',{
                templateUrl: 'components/evolution-of-prices/evolution-of-prices.template.html',
                controller: catchByTimePeriodController
            });
})();
