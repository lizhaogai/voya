"use strict";

var _ = require('lodash');
var sira = require('sira');
var needs = require('needs');

module.exports = exports = function (root, options) {
    if (typeof root === 'object') {
        options = root;
        root = null;
    }
    options = options || {};
    root = root || options.root || process.cwd();
    delete options.root;

    var sapp = new sira.Application();
    sapp.root = root;
    sapp.setAll(options);

    sapp.module = function (m) {
        if (typeof m !== 'string') throw new TypeError('module must be string for path');
        if (!Array.isArray(m)) m = [m];
        var modules = sapp.get('modules') || [];
        modules = _.union(modules, _.flatten(m));
        sapp.set('modules', modules);
    };

    sapp.on('before boot', function () {
        delete sapp.module;

        // phase extensions
        sapp.emit('phase:extensions', sapp);
        if (sapp.get('extensions')) {
            var extensions = needs(sapp.get('extensions'));
            _.forEach(extensions, function (ext) {
                if (typeof ext === 'function') sapp.phase(ext);
            });
        }
        sapp.emit('phase:after extensions', sapp);

        sapp.emit('phase:modules', sapp);
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

        sapp.emit('phase:after modules', sapp);

        sapp.emit('phase:auth', sapp);
        // phase auth
        if (sapp.enabled('auth')) {
            sapp.phase(require('sira-core').authorizer);
            sapp.emit('phase:after auth', sapp);
        }

        sapp.emit('phase:database', sapp);
        // init models and database
        sapp.phase(sira.boot.database(sapp.get('db') || sapp.get('database')));
        sapp.emit('phase:after database', sapp);

        sapp.emit('phase:initializers', sapp);
        // execute initializers
        if (sapp.get('initializers')) {
            sapp.phase(sira.boot.initializers(sapp.get('initializers')));
            sapp.emit('phase:after initializers', sapp);
        }
    });

    return sapp;
};
