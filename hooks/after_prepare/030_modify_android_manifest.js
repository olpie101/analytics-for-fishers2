#!/usr/bin/env node

// Adds removes duplicate entry from AndroidManifest.
// Changes the app icon from SalesForce icon to Abalobi icon

var sh = require('shelljs');
var fs   = require('fs');
var path = require('path');

var rootdir = process.argv[2];

if (rootdir) {
    // go through each of the platform directories that have been prepared
    var platforms = (process.env.CORDOVA_PLATFORMS ? process.env.CORDOVA_PLATFORMS.split(',') : []);

    for(var x=0; x<platforms.length; x++) {
        // open up the index.html file at the www root
        try {
            var platform = platforms[x].trim().toLowerCase();
            var manifestPath;

            if(platform == 'android') {
                manifestPath = path.join('platforms', platform, 'AndroidManifest.xml');
            }

            console.log("Attempting to modify AndroidManifest");

            const toReplace = '<activity android:exported="true" android:name="com.adobe.phonegap.push.PushHandlerActivity" />'
            const toReplace2 = new RegExp(/<activity android:configChanges="orientation\|keyboardHidden\|keyboard\|screenSize\|locale" android:label="@string\/app_name" android:name="com\.salesforce\.androidsdk\.phonegap\.ui\.SalesforceDroidGapActivity" android:theme="@android:style\/Theme\.Black\.NoTitleBar">[a-zA-z<>:\s="\.\/\-]+<\/activity>/);

            var data = fs.readFileSync(manifestPath, 'utf-8');
            data = data.replace(toReplace, '');
            data = data.replace(toReplace2,'');
            console.log('Removed duplicate entry');

            data = data.replace('@drawable/sf__icon', '@drawable/icon');
            console.log('Replaced SF app icon');

            //Add tools namespace to manifest
            const androidNamespace = 'xmlns:android="http://schemas.android.com/apk/res/android"';
            const toolsNamespace = 'xmlns:tools="http://schemas.android.com/tools"';
            if(!data.includes(toolsNamespace)){
                data = data.replace(androidNamespace, androidNamespace+' '+toolsNamespace);
                console.log("Added toolsNamespace");
            }

            //Override higher minSdkVersion from SalesForce packages
            const targetSdkVersion = 'android:targetSdkVersion="23"';
            const overrideRule = 'tools:overrideLibrary="com.salesforce.androidsdk.smartsync, com.salesforce.androidsdk.smartstore, com.salesforce.androidsdk, com.salesforce.androidsdk.hybrid"';
            if(!data.includes(overrideRule)) {
                data = data.replace(targetSdkVersion, targetSdkVersion+' '+overrideRule);
                console.log("Added SDK version override rules");
            }

            // Move uses sdk to above the application tag
            console.log("Rearranging contents");
            const usesSdkTag = new RegExp(/<uses-sdk [a-zA-z0-9\s:="\/\.,]+ \/>/);
            const manifestTag = new RegExp(/<manifest [a-zA-z0-9\s:="\/\.]+>/);
            var usesSdkMatch = data.match(usesSdkTag);
            var manifestTagMatch = data.match(manifestTag);
            if(usesSdkMatch && manifestTagMatch){
                data = data.replace(usesSdkTag, '');
                data = data.replace(manifestTag, manifestTagMatch+'\n\t'+usesSdkMatch);
                console.log("Rearranged contents");
            }

            fs.writeFileSync(manifestPath, data);
            console.log("Finished rearranging manifest contents");
        } catch(e) {
            process.stdout.write(e.toString());
        }
    }
}
