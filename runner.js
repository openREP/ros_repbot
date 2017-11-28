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
    { name: 'nodeName', alias: 'n', type: String },
];

const opts = commandLineArgs(optionDefs, { partial: true} );

const DEFAULT_NODE_NAME = 'repbot';

const cfgNodeName = opts.nodeName !== undefined ? opts.nodeName : DEFAULT_NODE_NAME;

// Parse remapping/private params input
var topicRemaps = {};
var privateParams = {};

opts._unknown.forEach((unkParam) => {
    // First split by :=
    var paramSplit = unkParam.split(':=');
    if (paramSplit.length != 2) return;

    if (paramSplit[0].charAt(0) === '_') {
        // This is a private param
        var paramName = paramSplit[0].substring(1);
        var paramValue = paramSplit[1];
        // If the first and last chars are " assume it's a string
        if (paramValue.charAt(0) === '"' &&
            paramValue.charAt(paramValue.length-1) === '"') {

            paramValue = paramValue.substring(1, paramValue.length - 1);
        }

        privateParams[paramName] = paramValue;
    }
    else {
        // this is a remap
        var topicName = paramSplit[0];
        var remappedName = paramSplit[1];

        topicRemaps[topicName] = remappedName;
    }
});

logger.info('Private Params: ', privateParams);
logger.info('Topic Remaps: ', topicRemaps);

// TODO we should just ensure that this script is only run via rosrun
// and that the config options will be provided via params
// This way, we can use a configuration maker (and pass it refs to
// the rosNode) to make special things happen
logger.info('Instantiating REPBot: ' + cfgNodeName);
var repbot = new REPBot(cfgNodeName, topicRemaps, privateParams);