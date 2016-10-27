(function() {
    'use strict';

    const refreshNavButtonController = function RefreshNavButtonController() {
        const ctrl = this;
    }

    angular.module('refreshButtonModule')
        .component('refreshNavButton', {
            templateUrl: 'components/refresh-nav-button/refresh-nav-button.template.html',
            controller: refreshNavButtonController,
            bindings: {
                refreshing: '=',
                refresher: '='
            }
        });
})();
