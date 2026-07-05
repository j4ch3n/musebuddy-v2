import { logger as reactNativeLogger, type LoggerInstance } from 'react-native-logs';

type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export type Logger = Pick<LoggerInstance<LogLevel>, LogLevel>;

const rootLogger = reactNativeLogger.createLogger({
  fixedExtLvlLength: true,
  printDate: true,
  printLevel: true,
  severity: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export function createLogger(scope = ''): Logger {
  return scope.length > 0 ? rootLogger.extend(scope) : rootLogger;
}

export const logger = createLogger();
