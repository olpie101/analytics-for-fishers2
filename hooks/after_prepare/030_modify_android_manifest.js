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

            const toReplace = '<activity android:exported="true" android:name="com.adobe.phonegap.push.PushHandlerActivity" />'
            var data = fs.readFileSync(manifestPath, 'utf-8');
            data = data.replace(toReplace, '');
            data = data.replace('@drawable/sf__icon', '@drawable/icon');
            fs.writeFileSync(manifestPath, data);
            console.log('Removed duplicate entry in AndroidManifest.xml.');
            console.log('Replaced SF app icon');
        } catch(e) {
            process.stdout.write(e.toString());
        }
    }
}
