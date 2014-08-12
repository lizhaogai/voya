"use strict";

var sira = require('sira');
var sc = require('sira-core');

module.exports = exports = function (root, options) {
    if (typeof root === 'object') {
        options = root;
        root = null;
    }
    root = root || options.root || process.cwd();
    delete options.root;

    var sapp = new sira.Application();
    sapp.root = root;
    sapp.setAll(options || {});

    // phase sira-core
    sapp.phase(sira.boot.module('sira-core'));

    // phase modules
    var modules = sapp.get('modules');
    if (typeof modules === 'string') {
        modules = [modules];
    }
    if (Array.isArray(modules)) modules.forEach(function (m) {
        sapp.phase(sira.boot.module(m));
    });

    // phase auth
    if (sapp.enabled('auth')) {
        sapp.phase(sc.authorizer);
    }

    // phase database and initializers on before boot
    sapp.on('before boot', function () {
        // init models and database
        sapp.phase(sira.boot.database(sapp.get('db') || sapp.get('database')));

        // execute initializers
        if (sapp.get('initializers')) {
            sapp.phase(sira.boot.initializers(sapp.get('initializers')));
        }
    });

    return sapp;
};