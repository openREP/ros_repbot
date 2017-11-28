const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;
const repbot_msgs = rosnodejs.require('repbot_msgs').msg;
const repbot_srvs = rosnodejs.require('repbot_msgs').srv;
const ConfigIOConstants = repbot_msgs.IOConfig.Constants;

const Robot = require('@ftl-robots/ftl-robot-host').Robot;
const RobotConstants = require('@ftl-robots/ftl-robot-host').Constants;

const EventEmitter = require('events');

const Logger = require('./utils/logger');
const logger = Logger.create('repbot');

const SENSOR_REFRESH_INTERVAL = 50; // time between refreshes in ms

/**
 * Like Promise.all() but will ALWAYS resolve. Returns an array of
 * status objects.
 * @param {Promise[]} promises 
 */
function promiseAllSafe(promises) {
    return new Promise((resolve, reject) => {
        var results = [];
        var count = promises.length;

        promises.forEach((aPromise, idx) => {
            aPromise.then((val) => {
                results[idx] = {
                    success: true,
                    value: val
                };
                count--;

                if (count === 0) {
                    resolve(results);
                }
            })
            .catch((err) => {
                results[idx] = {
                    success: false,
                    error: err
                };
                count--;

                if (count === 0) {
                    resolve(results);
                }
            });
        });
    });
}

class REPBot extends EventEmitter {
    constructor(nodeName, topicRemaps, privateParams) {
        super();

        this.d_nodeName = nodeName;
        // this.d_robotConfig = robotConfig;
        //this.d_robotHardware = new Robot(this.d_robotConfig);

        this.d_ready = false;

        // TODO We can parse command line args and look for 
        // := in order to handle private parameters and topic remapping
        // (basically to achieve parity with roscpp)
        // This only matters if we run via rosrun or from node directly
        // We can ignore it if we are roslaunch-ed since we can pass
        // params via the launch file
        logger.info('=== ROS REPBot Started ===');
        rosnodejs.initNode('/' + this.d_nodeName)
            .then(this._getParams.bind(this))
            .then(this._initializeHardware.bind(this))
            .then(this._setupNode.bind(this));
    }

    /**
     * Get required parameters from the ROS ParameterServer
     * It is undefined behavior to call this BEFORE rosnodejs.initNode
     * is called
     * @param {NodeHandle} rosNode
     * @return {Promise} Promise of a config object with both the node handle and config vars
     */
    _getParams(rosNode) {
        var rosNodePromise = Promise.resolve(rosNode);
        
        var paramsToGet = [
            { 
                key: 'robotConfig', 
                paramKey: '~configuration', // ROS Param Server key
                defaultValue: 'default' 
            }
        ]

        var paramsList = [];
        paramsToGet.forEach((paramInfo) => {
            paramsList.push(rosNode.getParam(paramInfo.paramKey));
        })

        return promiseAllSafe(paramsList)
            .then((paramValues) => {
                var config = {};
                paramValues.forEach((paramInfo, idx) => {
                    var cfgKey = paramsToGet[idx].key;
                    if (paramInfo.success) {
                        config[cfgKey] = paramInfo.value;  
                    }
                    else {
                        config[cfgKey] = paramsToGet[idx].defaultValue;
                    }
                });

                return {
                    nodeHandle: rosNode,
                    config: config
                };
            });
    }

    /**
     * Initialize the robot hardware given a ROS node handle and config params
     * @param {*} nodeInfo 
     * @return {Promise} Object containing node handle, config vars and robot instance
     */
    _initializeHardware(nodeInfo) {
        // NOTE: This is where we can create specialized configurations
        // and other robot hardware interfaces based off the config

        return {
            nodeHandle: nodeInfo.nodeHandle,
            config: nodeInfo.config,
            robotInstance: {} // TODO Implement
        }
    }

    /**
     * [INTERNAL] Called when the ROS Node has been initialized
     * @param {*} rosNode 
     */
    _setupNode(nodeInfo) {
        var rosNode = nodeInfo.nodeHandle;
        logger.info(`ROS Node /${this.d_nodeName} initialized`);

        logger.info('--- Parameters ---');
        for (var k in nodeInfo.config) {
            logger.info(k + ' => ', nodeInfo.config[k]);
        }

        this.emit('ready');
        this.d_ready = true;

        let digitalOutSub = rosNode.subscribe('~digital_out',
            repbot_msgs.DigitalIO, 
            (data) => {
                try {
                    this.d_robotHardware.writeDigital(data.channel, !!data.value);
                }
                catch (err) {
                    logger.error('Error while writing digital IO: ', err);
                }
            });

        let pwmOutSub = rosNode.subscribe('~pwm_out',
            repbot_msgs.PwmIO, 
            (data) => {
                try {
                    this.d_robotHardware.writePWM(data.channel, data.value);
                }
                catch (err) {
                    logger.error('Error while writing PWM IO: ', err);
                }
            });

        let digitalInPub = rosNode.advertise('~digital_in',
                                             repbot_msgs.DigitalIO);
        let analogInPub = rosNode.advertise('~analog_in',
                                            repbot_msgs.AnalogIO);

        // Service setup
        let configService = rosNode.advertiseService('~config_io', repbot_srvs.ConfigureIO,
            (req, resp) => {
                // Loop through all the configs
                var isError = false;
                req.configs.forEach((pinConfig) => {
                    // convert to constant
                    var pinType;
                    switch(pinConfig.config) {
                        case ConfigIOConstants.OUTPUT:
                            pinType = RobotConstants.PinModes.OUTPUT;
                            break;
                        case ConfigIOConstants.INPUT:
                            pinType = RobotConstants.PinModes.INPUT;
                            break;
                        case ConfigIOConstants.INPUT_PULLUP:
                            pinType = RobotConstants.PinModes.INPUT_PULLUP;
                            break;
                        default:
                            pinType = RobotConstants.PinModes.INPUT;
                    }

                    try {
                        this.d_robotHardware.configureDigitalPinMode(pinConfig.channel, pinType);
                    }
                    catch (err) {
                        logger.error(`Error configuring pin ${pinConfig.channel}: `, err);
                        // TODO We could potentially send an error message
                        isError = true;
                    }
                });

                resp.success = !isError;
                resp.retCode = isError ? 1 : 0;
                return true;
            });
        
        let enableService = rosNode.advertiseService('~enable', repbot_srvs.RobotEnable,
            (req, resp) => {
                if (req.enabled) {
                    this.d_robotHardware.enable();
                }
                else {
                    this.d_robotHardware.disable();
                }

                resp.success = true;
                return true;
            });

        // Get the port list
        // var portList = this.d_robotHardware.getPortList();
        
        // Always broadcast all the pin states
        // let refreshTimer = setInterval(() => {
        //     // Digital first
        //     var digitalPorts = portList.digital;
        //     digitalPorts.forEach((portInfo) => {
        //         if (portInfo.direction === RobotConstants.PortDirections.OUTPUT_ONLY) {
        //             return;
        //         }

        //         var pValue = this.d_robotHardware.readDigital(portInfo.channel);
        //         const dMsg = new repbot_msgs.DigitalIO({
        //             source: "repbot-robot-hardware",
        //             channel: portInfo.channel,
        //             value: pValue ? 1 : 0
        //         });
        //         digitalInPub.publish(dMsg);
        //     });

        //     var analogPorts = portList.analog;
        //     analogPorts.forEach((portInfo) => {
        //         var pValue = this.d_robotHardware.readAnalog(portInfo.channel);
        //         const aMsg = new repbot_msgs.AnalogIO({
        //             source: "repbot-robot-hardware",
        //             channel: portInfo.channel,
        //             value: pValue
        //         });
        //         analogInPub.publish(aMsg);
        //     });

        // }, SENSOR_REFRESH_INTERVAL);
    }

    get ready() {
        return this.d_ready;
    }
}

module.exports = REPBot;