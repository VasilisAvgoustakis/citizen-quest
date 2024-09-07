const winston = require('winston');

function configureWinston(options) {
  winston.configure({
    level: options.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf((info) => {
        return `${info.timestamp} ${info.level}: ${info.message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
    ],
  });

  return winston;
}

module.exports = configureWinston;
