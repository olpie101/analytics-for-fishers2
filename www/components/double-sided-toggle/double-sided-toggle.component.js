(function() {
    'use strict';

    var dstController = function doubleSidedToggleController() {
        var ctrl = this;

        ctrl.change = function(value) {
            console.log("update on item => "+value);
            ctrl.onChange({value: value}); //The key here must match the variable name on the function being called.
            //For better insight look at the 'monthly-catch-species-by-boat-type' component
            //calculationToggleUpdate function
        }
    }

    angular.module('doubleSidedToggleModule')
        .component('doubleSidedToggle', {
            templateUrl: 'js/double-sided-toggle/double-sided-toggle.template.html',
            controller: dstController,
            bindings: {
                label: '@',
                leftOption: '@',
                rightOption: '@',
                onChange: '&'
            }
        });
})();
