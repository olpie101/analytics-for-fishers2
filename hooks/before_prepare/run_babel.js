#!/usr/bin/env node

var sh = require('shelljs');
var fs   = require('fs');
var path = require('path');

var rootdir = process.argv[2];

if (rootdir) {
    sh.exec('gulp babel');
}
