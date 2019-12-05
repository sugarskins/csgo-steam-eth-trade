const winston = require('winston')
const getNamespace = require('cls-hooked').getNamespace
const createNamespace = require('cls-hooked').createNamespace
const uuidv4 = require('uuid/v4')

const LOGGING_NAMESPACE_NAME = '74f218de-9c83-42b3-83d5-cfbee4cc1b0b'
const CONTINUATION_ID_VAR_NAME = 'continuationId'

let loggingSession = getNamespace(LOGGING_NAMESPACE_NAME)
if (!loggingSession) {
  loggingSession = createNamespace(LOGGING_NAMESPACE_NAME)
}

function runWithContinuationId(value, f) {
  if (!value) {
    value = uuidv4()
  }
  let returnValue = null;
  loggingSession.run(() => {
    loggingSession.set(CONTINUATION_ID_VAR_NAME, value);
    returnValue = f()
  });
  return returnValue;
}

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
  const continuationId = loggingSession.get(CONTINUATION_ID_VAR_NAME)
  return `${timestamp ? `${timestamp} ` : ''}${
    continuationId ? `[${continuationId}] ` : ''
    }${level}: ${message}`
})

const continuationIdFormat = winston.format((info, opts) => {
  const continuationId = loggingSession.get(CONTINUATION_ID_VAR_NAME)
  info.continuationId = continuationId
  return info
});

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        continuationIdFormat(),
        myFormat
      ),
      filename: `${__dirname}/app.log`,
      handleExceptions: true
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        continuationIdFormat(),
        myFormat
      ),
      level: 'debug',
      handleExceptions: true
    })
  ],
  exitOnError: false
})

logger.runWithContinuationId = runWithContinuationId

module.exports = logger
