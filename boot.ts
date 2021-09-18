import { cleanEnv as envVarChecker, str, port } from 'envalid'

import { startServer } from './server/server'
import { mainLogger } from './logging/logging'

envVarChecker(process.env, {
  PORT: port({ default: 8080 }), // eslint-disable-line @typescript-eslint/no-magic-numbers
  PUBLIC_FOLDER: str({ default: './frontend-build' }),
  LOGDIR: str({ default: './roffline-logs' }),
  POSTS_MEDIA_DOWNLOAD_DIR: str({ default: './posts-media' }),
  DBPATH: str({ default: './roffline-storage.db' }),
  NODE_ENV: str({ choices: ['development', 'test', 'testing', 'production'] }),
  LOGGING_LEVEL: str({ choices: ['debug', 'error'], default: 'error' }),
})

function bailOnFatalError(err: Error): void {
  console.error(err)
  // eslint-disable-next-line functional/no-try-statement
  try {
    // db.close(RA.noop)
  } catch (error) {
  } finally {
    // eslint-disable-next-line functional/no-try-statement
    try {
      mainLogger.fatal(err)
    } catch (error) {
    } finally {
      process.exit(1)
    }
  }
}

process.on('unhandledRejection', bailOnFatalError)
process.on('uncaughtException', bailOnFatalError)

// db.init()
//   .then(scheduleUpdates)
//   .then(regularlyTrimReddit429Responses)
//   .then(startServer)
//   .catch(err => {
//     console.error(err)
//     process.exit(1)
//   })
startServer().catch(err => {
  console.error(err)
  mainLogger.fatal(err)
  process.exit(1)
})
