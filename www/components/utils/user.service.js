(function() {
    'use strict';

    angular.module('utilsModule')
        .factory('userservice', function(force){
            var type = null;
            var usrId = null;
            var email = null;

            const Id = function() {
                console.log("getting userId");
                console.log(usrId);

                return new Promise((resolve, reject) => {
                    if(usrId == null) {
                        var oauthPlugin = cordova.require("com.salesforce.plugin.oauth");
                        return oauthPlugin.getAuthCredentials(function(creds) {
                            usrId = creds.userId;
                            console.log("resolving -> "+usrId);
                            resolve(usrId)
                        });
                    }else {
                        console.log("getting user elsing");
                        resolve(usrId)
                    }
                });
            }

            const userType = function () {
                return new Promise((resolve, reject) => {
                    if (type == null){
                        Id()
                        .then(uId => {
                            var query = "SELECT abalobi_usertype__c FROM User WHERE Id = '"+
                            uId+"'";
                            return force.query(query)
                        })
                        .then(result => {
                            type = result.records[0].abalobi_usertype__c;
                            return resolve(type);
                        });
                    }else {
                        return resolve(type);
                    }
                });
            }

            const userEmail = function () {
                console.log("getting user email");

                return new Promise((resolve, reject) => {
                    if (email == null){
                        Id()
                        .then(uId => {
                            var query = "SELECT Email FROM User WHERE Id = '"+
                            uId+"'";
                            return force.query(query);
                        })
                        .then(result => {
                            email = result.records[0].Email;
                            console.log("got user email -> "+email);
                            return resolve(email);
                        });
                    }else {
                        console.log("got user email from else-> "+email);
                        return resolve(email);
                    }
                });
            }

            return {
                userType: userType,
                userId: Id,
                userEmail: userEmail
            };
        });
})();
