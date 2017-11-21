const winston = require('winston');

const tsFormat = () => (new Date()).toLocaleTimeString();

module.exports = {
    create: (moduleId) => {
        if (!moduleId) {
            moduleId = 'DEFAULT';
        }

        const logger = new (winston.Logger)({
            filters: [
                (level, msg, meta) => {
                    return `[${moduleId}] ${msg}`;
                }
            ],
            transports: [
                new (winston.transports.Console)({
                    timestamp: tsFormat,
                    colorize: true
                })
            ]
        });

        return logger;
    }
};