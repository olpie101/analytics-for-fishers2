(function() {
    'use strict';

    angular.module('utilsModule')
        .factory('userservice', function(force){
            var type = null;
            var usrId = null;

            const Id = function(resolve) {
                if(usrId == null) {
                    var oauthPlugin = cordova.require("com.salesforce.plugin.oauth");
                    return oauthPlugin.getAuthCredentials(function(creds) {
                        usrId = creds.userId;
                        if(resolve){
                            resolve(usrId)
                        }else{
                            return usrId;
                        }
                    });
                }else {
                    if(resolve){
                        resolve(usrId)
                    }else{
                        return usrId;
                    }
                }
            }

            const userType = function () {
                if (type == null){
                    return new Promise((resolve, reject) => Id(resolve))
                        .then(uId => {
                            var query = "SELECT abalobi_usertype__c FROM User WHERE Id = '"+
                            uId+"'";
                            return force.query(query)
                        })
                        .then(result => {
                            type = result.records[0].abalobi_usertype__c;
                            return type;
                        });
                }else {
                    return type;
                }
            }

            return {
                userType: userType,
                userId: Id,
            };
        });
})();
