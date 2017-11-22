REPBot
======
### An open robotics experimentation platform, powered by ROS

**REPBot is part of the Open Robotics Experimentation Platform (OpenREP) framework, and provides an interface to actual hardware.**

## Introduction and components
REPBot starts up a [ROS](https://www.ros.org) node that subscribes and publishes on a few different channels (details below). These channels provide (essentially) direct access to the GPIO/PWM pins of the target robot platform. The software interface to the robot is provided via an [ftl-robot-host](https://github.com/ftl-robots/ftl-robot-host) implementation.

REPBot is provided as a module which can be instantiated in a 'runner' application (see runner.js for details).

## Basic Usage
```javascript
const REPBot = require('ros_repbot').REPBot;

// Provide a suitable ftl-robot-host config
var config = {...};

// Instantiate and hookup the REPBot node
var repbot = new REPBot('repbot', config);

// Done!
```

## ROS Topics
REPBot uses a few ROS topics in order to operate, details of which are below. The topics are divided into several categories: Output, Input, and System. Each topic header will also take the form of `topic_name (message_type) [direction]`, where `message_type` is a ROS message type, and `direction` is one of IN or OUT, where IN represents the ROS node subscribing to that topic, and OUT represents the ROS node publishing that topic.

All topics are also namespaced to the REPBot node name. For example, if your node name is `repbot`, then the digital output topic would be `/repbot/digital_out`.

### Output (Controller -> Robot Hardware)
These topics allow controller nodes to directly interact with output pins on the robot target (e.g. setting digital pins high or low, writing PWM values, etc).

**~digital_out (repbot_msgs.DigitalIO) [IN]**  
This topic represents a call to modify the state or a particular digital output channel. A value of 1 represents HIGH and 0 represents LOW.

**~pwm_out (repbot_msgs.PwmIO) [IN]**  
This topic represents a call to modify the PWM output of a particular PWM channel. The acceptable values are from 0 to 255, where 0 represents 0% duty cycle, and 255 represents 100% duty cycle. On robot hardware controlling servos or motors, this gets mapped to the appropriate angle/throttle setting

### Input (Robot Hardware -> Controller)
These topics allow the robot hardware to advertise the pin state of various GPIO inputs (e.g. digital values on a pin).

**~digital_in (repbot_msgs.DigitalIO) [OUT]**  
This topic represents a pin state update for a particular digital channel. This could get sent on a regular interval, or in response to a pin value change.

**~analog_in (repbot_msgs.AnalogIO) [OUT]**  
This topic represents a pin state update for a particular analog channel. This could get sent on a regular interval, or in response to a pin value change.

### System
These topics represent system level messages to/from the robot hardware and controller

**~system_messages (repbot_msgs.SystemMsg) [OUT]**  
This topic represents a system message from the robot host.

## ROS Services
REPBot provides a few services, mainly around configuration. Each service header takes the form of `service_name (service_type)`, where `service_type` is a ROS service type.

### Configuration
These services deal with configuring the robot hardware.

**~configure_io (repbot_msgs.ConfigureIO)**  
Configure a set of digital IO pins

## Events
TBD