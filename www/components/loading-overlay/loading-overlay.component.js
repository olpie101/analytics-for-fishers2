(function() {
    'use strict';

    angular.module('loadingOverlayModule')
        .component('loadingOverlay', {
            templateUrl: 'components/loading-overlay/loading-overlay.template.html',
            bindings: {
                loading: '=',
            }
        });
})();
