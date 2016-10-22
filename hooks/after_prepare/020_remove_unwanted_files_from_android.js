#!/usr/bin/env node

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
            var wwwPath;
            //
            if(platform == 'android') {
                wwwPath = path.join('platforms', platform, 'assets', 'www');
            }

            sh.cd(wwwPath);
            sh.exec("rm -rf components js");
            sh.mv('dist/js', '.');
            sh.mv('dist/components', '.');
            sh.rm('-rf', 'dist');
        } catch(e) {
            process.stdout.write(e.toString());
        }
    }
}
