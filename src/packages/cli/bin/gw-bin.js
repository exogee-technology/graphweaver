#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
var fs = require('fs');
var a = fs.existsSync('index.js');
var path = require('path');
if (fs.existsSync(path.join(__dirname, 'index.js'))) {
	require('./index.js');
} else {
	console.log('You need to build the cli package first');
}
