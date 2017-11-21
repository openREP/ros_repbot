const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;
const commandLineArgs = require('command-line-args');

const Logger = require('./utils/logger');
const logger = Logger.create('main');

// Bail out early if we aren't the main module
if (require.main !== module) {
    logger.error('This application needs to be run, not included');
    process.exit(1);
}

const optionDefs = [
    { name: 'nodeName', alias: 'n', type: String, defaultOption: true},
];

const opts = commandLineArgs(optionDefs, { partial: true} );

const DEFAULT_NODE_NAME = 'repbot';

const cfgNodeName = opts.nodeName !== undefined ? opts.nodeName : DEFAULT_NODE_NAME;

logger.info('=== ROS REPBot Starting ===');

rosnodejs.initNode('/' + cfgNodeName)
    .then((rosNode) => {
        logger.info(`ROS Node /${cfgNodeName} initialized`);

        // Set up the listeners
        let outputSub = rosNode.subscribe('/repbot_out', std_msgs.String, (data) => {
            // TODO handle the output commands
        });

        // Set up the publisher
    })

