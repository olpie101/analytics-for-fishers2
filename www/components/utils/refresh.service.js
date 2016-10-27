(function() {
    'use strict';

    angular.module('utilsModule')
    .factory('refreshBus', function(){
        var subject = new Rx.Subject();

        function post(evt) {
            subject.onNext(evt);
        }

        function observable() {
            return subject.asObservable();
        }

        return {
            post: post,
            observable: observable
        }
    });
})();
