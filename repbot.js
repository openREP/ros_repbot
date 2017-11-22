const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;
const repbot_msgs = rosnodejs.require('repbot_msgs').msg;
const repbot_srvs = rosnodejs.require('repbot_msgs').srv;

const EventEmitter = require('events');

const Logger = require('./utils/logger');
const logger = Logger.create('repbot');

class REPBot extends EventEmitter {
    constructor(nodeName, robotConfig) {
        super();

        this.d_nodeName = nodeName;
        this.d_robotConfig = robotConfig;
        this.d_robotHardware; // TODO Implement

        this.d_ready = false;

        logger.info('=== ROS REPBot Started ===');
        rosnodejs.initNode('/' + nodeName)
            .then(this._setupNode.bind(this));
    }

    /**
     * [INTERNAL] Called when the ROS Node has been initialized
     * @param {*} rosNode 
     */
    _setupNode(rosNode) {
        logger.info(`ROS Node /${this.d_nodeName} initialized`);
        this.emit('ready');
        this.d_ready = true;

        let digitalOutSub = rosNode.subscribe('~digital_out',
            repbot_msgs.DigitalIO, 
            (data) => {

            });

        let pwmOutSub = rosNode.subscribe('~pwm_out',
            repbot_msgs.PwmIO, 
            (data) => {

            });

        let digitalInPub = rosNode.advertise('~digital_in',
                                             repbot_msgs.DigitalIO);
        let analogInPub = rosNode.advertise('~analog_in',
                                            repbot_msgs.AnalogIO);

        // Service setup
        let configService = rosNode.advertiseService('~config_io', repbot_srvs.ConfigureIO,
            (req, resp) => {

            });

        // TODO Hookup with the robot host
    }

    get ready() {
        return this.d_ready;
    }
}

module.exports = REPBot;