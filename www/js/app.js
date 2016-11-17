// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'forceng', 'starter.controllers', 'config', 'barChartModule',
                'stackedBarChartModule', 'doubleSidedToggleModule', 'catchByTimePeriodModule',
                'utilsModule', 'loadingOverlayModule', 'recentTripsModule',
                'expensesIncomeReportModule','refreshButtonModule'])

  .run(function ($ionicPlatform, $state, force, forcengOptions) {

    $ionicPlatform.ready(function () {

      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        window.cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      // Initialize forceng
      var oauthPlugin = cordova.require("com.salesforce.plugin.oauth");
      oauthPlugin.getAuthCredentials(function(creds) {
          console.log("auth plugin got details");
          console.log(creds);
         force.init({
             appId: creds.clientId,
             apiVersion: 'v36.0',
             instanceUrl: creds.instanceUrl,
             accessToken: creds.accessToken,
             refreshToken: creds.refreshToken
         });

        //  var forceClient = new forcetk.Client(creds.clientId, creds.loginUrl);
        //  forceClient.setSessionToken(creds.accessToken, "v36.0", creds.instanceUrl);
        //  forceClient.setRefreshToken(creds.refreshToken);
      });

      if (forcengOptions.accessToken) {
        // If the accessToken was provided (typically when running the app from within a Visualforce page,
        // go straight to the contact list
        $state.go('app.recents');
      } else {
        // Otherwise (the app is probably running as a standalone web app or as a hybrid local app with the
        // Mobile SDK, login first.)
        force.login().then(
          function () {
            $state.go('app.recents');
          },
          function(error) {
            alert("Login was not successful");
          });
      }

    });
  })

  .config(function ($stateProvider, $urlRouterProvider, baseURL) {

    // baseURL (defined in the config.js module) is only there to support running the same app as a Mobile SDK
    // hybrid local and hybrid remote app (where the app is run from withing a Visualforce page). When running the
    // app inside a Visualforce page, you have to account for the path of the app's static resource. To accomplish
    // that, you create the config module from within the VF page (as opposed to importing config.js), and set
    // baseURL to the app's static resource path.

    $stateProvider

      .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: baseURL + "templates/menu.html",
        controller: 'AppCtrl'
      })

      .state('app.contactlist', {
        url: "/contactlist",
        views: {
          'menuContent': {
            templateUrl: baseURL + "templates/contact-list.html",
            controller: 'ContactListCtrl'
          }
        }
      })
      .state('app.recents', {
        url: "/recents",
        views: {
          'menuContent': {
            templateUrl: baseURL + "templates/recent-trips.html"
          }
        }
      })
      .state('app.catchtimeperiod', {
        url: "/catch-by-time-period",
        views: {
          'menuContent': {
            templateUrl: baseURL + "templates/catch-by-time-period.html"
          }
        }
      })
      .state('app.expenseincomereport', {
        url: "/expenses-income-report",
        views: {
          'menuContent': {
            templateUrl: baseURL + "templates/expenses-income-report.html"
          }
        }
      });

  });
