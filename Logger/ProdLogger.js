const { format, createLogger, transports } = require('winston');
const { timestamp, combine, printf, errors, json } = format;

// const myFormat = printf(() => {
//     return `{"timestamp": "${timestamp}", "user_id": "${userId}", "Method": "${method}", "req_url": "${req_url}", "username": "${username}", "user_address": "${user_address}", "user_email": "${user_email}", "message": "${message}", "authenticated": "${authenticated}", "level": "${level}"}`;
// });

function buildLogger() {
    const logger = createLogger({
        format: combine(
            timestamp(),
            errors({ stack: true }),
            json(),
            format.json()
        ),
        defaultMeta: { service: 'user-service' },
        transports: [
            // new transports.Console(),
            new transports.File({ 
                filename: "Log/exceptions.log",
            })
        ]
    })

    return logger;
};

module.exports = buildLogger;

