const consoleDisabledError = (...args: any[]) => {
  const message = args.map((arg) => arg.toString()).join(" ");
  throw new Error("use context.logger instead of console in test. Message: " + message);
};

const _info = console.info;
const _warn = console.warn;

console.log = consoleDisabledError;
console.info = consoleDisabledError;
console.warn = consoleDisabledError;
console.error = consoleDisabledError;

/**
 * Custom, optionally unbuffered, logger that obeys the VITE_LOG_LEVEL
 */
export class Logger {
  _unbuffered: boolean;

  constructor() {
    this._unbuffered = process.env.VITE_PERFORMANCE_TESTS === "true";
  }

  async _write(stream: NodeJS.WriteStream, consoleStream: typeof console.log, args: any[]) {
    if (this._unbuffered) {
      await new Promise<void>((resolve) => {
        stream.write(args.join(" ") + "\n", "utf-8", () => {
          resolve();
        });
      });
    } else {
      consoleStream(...args);
    }
  }

  async info(...args: any[]) {
    if (
      process.env.VITE_LOG_LEVEL === "info" ||
      process.env.VITE_LOG_LEVEL === "debug"
    ) {
      await this._write(process.stdout, _info, args);
    }
  }

  async warn(...args: any[]) {
    await this._write(process.stderr, _warn, args);
  }
}
