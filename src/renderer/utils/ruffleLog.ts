import type { LognalConsole } from 'lognal';

// The levels of the debug log setting. `off` keeps the log closed, and the rest
// are Ruffle's own, each one recording the levels before it as well.
export const DEBUG_LOG_LEVELS = ['off', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export type DebugLogLevel = (typeof DEBUG_LOG_LEVELS)[number];

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

// Ruffle's scripts come from the copy shipped with the app, and a call one of
// them makes names its address in the stack.
const RUFFLE_SOURCES = ['/js/ruffle/'];
const CAPTURED_METHODS: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];
// Ruffle writes every log line through `console.log`, the level first and
// styled, as in `%cINFO%c`. The line goes to the method of its level, so the
// viewer's level filter sorts Ruffle's lines.
const RUFFLE_LINE_LEVEL = /^%c(TRACE|DEBUG|INFO|WARN|ERROR)%c/;
const LINE_METHODS: Record<string, ConsoleMethod> = {
  TRACE: 'debug',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

// With the log off, Ruffle reports errors only, as it always has.
export const toRuffleLogLevel = (level: DebugLogLevel): Exclude<DebugLogLevel, 'off'> =>
  level === 'off' ? 'error' : level;

// Chromium's own additions to `Error`, which the DOM types leave out.
const V8Error = Error as ErrorConstructor & {
  stackTraceLimit: number;
  captureStackTrace: (target: object, constructorOpt?: (...args: unknown[]) => void) => void;
};

// Only the frame that called the console is read, which keeps a busy log cheap.
const isCalledFromRuffle = (wrapper: (...args: unknown[]) => void): boolean => {
  const holder: { stack?: string } = {};
  const { stackTraceLimit } = V8Error;

  V8Error.stackTraceLimit = 1;
  V8Error.captureStackTrace(holder, wrapper);
  V8Error.stackTraceLimit = stackTraceLimit;

  const frame = holder.stack ?? '';

  return RUFFLE_SOURCES.some((source) => frame.includes(source));
};

const toTargetMethod = (method: ConsoleMethod, args: unknown[]): ConsoleMethod => {
  const lineLevel = typeof args[0] === 'string' ? RUFFLE_LINE_LEVEL.exec(args[0])?.[1] : undefined;

  return lineLevel ? LINE_METHODS[lineLevel] : method;
};

// Copies what Ruffle writes to the console into `target` and leaves the app's
// own messages out. Every call still reaches the console. Returns the function
// that puts the console back.
export const captureRuffleConsole = (target: LognalConsole): (() => void) => {
  const restorers = CAPTURED_METHODS.map((method) => {
    const original = console[method];
    const wrapper = (...args: unknown[]) => {
      try {
        if (isCalledFromRuffle(wrapper)) {
          target[toTargetMethod(method, args)](...args);
        }
      } catch {
        // The log is a debugging aid and never gets in the way of the call.
      }

      original.apply(console, args);
    };

    console[method] = wrapper;

    return () => {
      // A method another script wrapped after this one is left to that script.
      if (console[method] === wrapper) {
        console[method] = original;
      }
    };
  });

  return () => restorers.forEach((restore) => restore());
};
