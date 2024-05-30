#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, 'index.js'))) {
	require('./index.js');
} else {
	console.log('You need to build the cli package first');
}
