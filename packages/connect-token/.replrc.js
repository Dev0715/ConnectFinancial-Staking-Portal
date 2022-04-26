'use strict';

var hardhat = require('hardhat');
var { ProxyAdmin } = require('./lib/proxy-admin.js');
var { ConnectToken } = require('./lib/main');

var connectToken = ConnectToken.get('1');

