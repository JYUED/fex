'use strict';

var path = require('path'),
    fs   = require('fs'),
    gulp = require('gulp');

module.exports = function Component(component, $devDir, $releaseDir) {
    // jsFiles($c._dir )
    this.devDir = $devDir || './src';
    this.releaseDir = $releaseDir || './public';

    this._name = component;
    this._dir = path.join(this.devDir, component);
    this._releaseDir = path.join(this.releaseDir, component); 
    this._manifestPath = path.join(this.releaseDir,'rev-manifest.json');
    this._jsPath = path.join(this._dir, 'js');
}
