#!/usr/bin/env node

const commandLineArgs = require('command-line-args');

const Logger = require('./utils/logger');
const logger = Logger.create('repbot-runner');

const REPBot = require('./repbot');

// Bail out early if we aren't the main module
if (require.main !== module) {
    logger.error('This script should be executed, not require()-ed');
    process.exit(1);
}

const optionDefs = [
    { name: 'nodeName', alias: 'n', type: String, defaultOption: true},
];

const opts = commandLineArgs(optionDefs, { partial: true} );

const DEFAULT_NODE_NAME = 'repbot';

const cfgNodeName = opts.nodeName !== undefined ? opts.nodeName : DEFAULT_NODE_NAME;

logger.info('Instantiating REPBot');
var repbot = new REPBot(cfgNodeName, {});