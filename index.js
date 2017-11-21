const rosnodejs = require('rosnodejs');
const std_msgs = rosnodejs.require('std_msgs').msg;

function listener() {
    rosnodejs.initNode('/listener_node')
        .then((rosNode) => {
            let sub = rosNode.subscribe('/chatter', std_msgs.String,
            (data) => {
                rosnodejs.log.info('I heard: [' + data.data + ']');
            });
        });
}

if (require.main === module) {
    listener();
}