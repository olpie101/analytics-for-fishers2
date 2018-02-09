**NB: This repository is no longer maintained. Please refer to the updated version here: [Abalobi Analytics 3](https://github.com/AbalobiSA/analytics-for-fishers-3)**

This is a hybrid local app running on Cordova, using Ionic, AngularJS and the SalesForce App SDK. More information on this can be found at the  [Salesforce Getting Started Guide](https://trailhead.salesforce.com/mobile_sdk_hybrid/mobilesdk_hybrid_getting_started).


# Getting started

The repo only contains the necessary source code. The platform and plugins need to downloaded once you have the repo.

### Prerequisites
In order for the source to compile you require the following to already be installed:
* NodeJs (consider using [`nvm`](https://github.com/creationix/nvm) to manage your node installations)
* ionic
* cordova (compiled using v6.2.0 though later version should work)
* AndroidStudio (optional, but easier)

You'll need to install the correct version of cordova:

    $ npm install -g cordova@6.2.0

### Installation
* Clone this repo and enter the directory
* Run `npm install`
* Install `shelljs 0.7.0` by running `npm install shelljs@0.7.0`
* Run `bower install`
* Ensure that you `ANDROID_HOME` environment variable is set and correctly points to the directory where your Android SDK is located, otherwise the remaining steps will fail.
* Install the SalesForce SDK by running `cordova plugin add https://github.com/forcedotcom/SalesforceMobileSDK-CordovaPlugin\#v4.3.1`
* Add the Android plugin `cordova platform add android`
* Open the file `platforms/android/gradle/wrapper/gradle-wrapper.properties` and change the version number for the `distributionUrl` for the gradle wrapper from `2.12` to `2.2`


* Rename `www/bootconfig-example.json` to `bootconfig.json`
* Add necessary `remoteAccessConsumerKey` and `oauthRedirectURI` to bootconfig file.


* Import the `platforms/android` folder into a new Android Studio project
* Go into Android Studio settings and disable `Instant Run`.

> DO NOT UPDATE GRADLE!!! If you accidentally update gradle, simple change the version number in `gradle-wrapper.properties` back to `2.2`

### Adding plugins
You'll be able to add plugins as usual by using

    $ cordova plugin add plug-in_name
    $ cordova prepare

Before adding other plug-ins to a forcedroid app, first remove the `com.salesforce` plug-in, and then re-add it after you’ve added your other plug-ins. Here’s an example:

    $ cordova plugin remove com.salesforce
    $ cordova plugin add <some_other_plugin>
    $ ...
    $ cordova plugin add <last_other_plugin>
    $ cordova plugin add com.salesforce


> *Important Note:* Never call cordova plugin add for plug-ins provided by Mobile SDK. These plug-ins are automatically included in forcedroid and forceios hybrid projects.

### Building & making changes
>You'll need to import the project into Android Studio if you have not done so
already, as `cordova build <platform>` does not work with this specific setup. More on this can be
found at the [Salesforce Getting Started Guide](https://trailhead.salesforce.com/mobile_sdk_hybrid/mobilesdk_hybrid_getting_started).

When you'd like your changes to show up in Android Studio, run

    $ cordova prepare

After this, you'll need to open the Android Manifest file:

    ./platforms/android/AndroidManifest.xml

You'll need to delete the following line from the manifest

`<activity android:exported="true" android:name="com.adobe.phonegap.push.PushHandlerActivity" />`

in order to be able to build in Android Studio. It should be a single line.

Then switch to android studio, and build / run.

-----
# Common Issues
### The app crashes on startup
If the app is crashing on startup:
- Check if there is an older version of the app on the phone, possibly under a different package name.
- Uninstall all versions of the app, then re-install the latest version from the Play Store.

This is due to the credentials of the old Salesforce Analytics app and those of the new app being stored in the same location on internal storage.

### Not visible in the play store
- The salesforce app SDK only supports devices running **Android 4.4.x and up.** If your device does not meet this requirement, you will not see the app in the play store.

- Another possibility is that the device you are using does not meet the **permission requirements**. This could mean your device could be  incapable of receiving SMS's, for example, in which case the app will also not be visible from the store if browsing from your device.
> In this case, you will still be able to side-load the app manually using the raw apk, but you might find errors when using unsupported features.
