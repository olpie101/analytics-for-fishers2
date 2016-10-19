(function() {
    'use strict';

    var demoController = function DemoController(force){
        //your controller stuff here
        console.log("this controller");
        console.log(this);
        var ctrl = this;

        ctrl.$onInit = function() {
            console.log("Demo controller init");
            force.query('SELECT main_fisher_id__c, trip_date__c, '+
                'landing_site__c FROM Ablb_Fisher_Trip__c')
                .then(updateItems,showError);
        }

        var updateItems = function(it){
            console.log("updating items");
            console.log(it);
            ctrl.items = it.records;
        }

        var showError = function(err) {
            console.log("error occured");
            console.log(err);
        }
    }

    angular.module('demoQueryModule')
        .component('demoQuery', {
            templateUrl: 'components/demo_query/demo_query.template.html',
            controller: demoController
        })
})();
