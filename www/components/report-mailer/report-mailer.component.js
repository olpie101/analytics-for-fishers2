(function() {
    'use strict';

    const reportMailerController = function reportMailerController (userservice, $http, $timeout) {
        var ctrl = this;
        var emailPromise = userservice.userEmail();
        var userIdPromise = userservice.userId();
        var userId;

        ctrl.$onInit = function() {
            ctrl.requestStatus = 0;
            userIdPromise.then(result => userId = result);
            emailPromise.then(result => {
                console.log("email -> "+result);
                ctrl.email = result;
            });
        }

        ctrl.getemail = function() {
            $timeout(function(){}, 2000);
            return ctrl.email;
        }

        ctrl.send = function() {
            var endpoint = 'http://'+userservice.pdfMailerUri+'/pdf-report?ownerId='+userId+"&destEmail="+ctrl.email;
            console.log("sending -> "+endpoint);
            $http({method: 'GET', url: endpoint})
                .then(response => ctrl.requestStatus = 1)
                .catch(reason => ctrl.requestStatus = -1);
        }
    }

    angular.module('reportMailerModule')
            .component('reportMailer',{
                templateUrl: 'components/report-mailer/report-mailer.template.html',
                controller: reportMailerController
            });
})()
