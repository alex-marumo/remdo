
const consoleDisabledError = () => {
  throw new Error("use context.logger instead of console in test");
};
console.log = consoleDisabledError;
console.info = consoleDisabledError;
console.warn = consoleDisabledError;
console.error = consoleDisabledError;

/**
* Custom, optionally unbuffered logger that obeys the VITE_LOG_LEVEL
 */
export class Logger {
  _unbuffered: boolean;

  constructor() {
    this._unbuffered = process.env.VITE_PERFORMANCE_TESTS === "true";
  }

  async _write(stream: NodeJS.WriteStream, args: any[]) {
    await new Promise<void>((resolve) => {
      stream.write(args.join(" ") + "\n", "utf-8", () => {
        resolve();
      });
    });
  }

  async info(...args: any[]) {
    if (
      process.env.VITE_LOG_LEVEL === "info" ||
      process.env.VITE_LOG_LEVEL === "debug"
    ) {
      if (this._unbuffered) {
        await this._write(process.stdout, args);
      } else {
        console.info(args);
      }
    }
  }

  async warn(...args: any[]) {
    if (this._unbuffered) {
      await this._write(process.stderr, args);
    } else {
      console.warn(args);
    }
  }
}
