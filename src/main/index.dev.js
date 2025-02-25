/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

/* eslint-disable */

// Install `electron-debug` with `devtron`
require('electron-debug')()

// Install 'devtron'
// require('electron').app.on('ready', require('devtron').install)

// Require `main` process to boot app
require('./index')
