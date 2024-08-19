import fs from 'fs';
import path from 'path';
import { debugEnabled } from '../common';

const _info = console.info;
const _warn = console.warn;
const _error = console.error;

const consoleDisabledError = (...args: any[]) => {
  const message = args.map((arg) => arg?.toString()).join(" ");
  _error("use context.logger instead of console in test.");
  _info(message);
};

console.log = consoleDisabledError;
console.info = consoleDisabledError;
console.warn = consoleDisabledError;
console.error = consoleDisabledError;

/**
 * Custom, optionally unbuffered, logger that obeys the VITE_LOG_LEVEL
 */
export class Logger {
  _performanceTests: boolean;

  constructor() {
    this._performanceTests = process.env.VITE_PERFORMANCE_TESTS === "true";
  }

  async _write(stream: NodeJS.WriteStream, consoleStream: typeof console.log, args: any[]) {
    if (this._performanceTests) {
      await new Promise<void>((resolve) => {
        stream.write(args.join(" ") + "\n", "utf-8", () => {
          resolve();
        });
      });
    } else {
      consoleStream(...args);
    }
  }

  async debug(...args: any[]) {
    if (
      process.env.VITE_LOG_LEVEL === "debug" ||
      this._performanceTests
    ) {
      await this._write(process.stdout, _info, args);
    }
  }

  async info(...args: any[]) {
    //if (
    //  process.env.VITE_LOG_LEVEL === "info" ||
    //  process.env.VITE_LOG_LEVEL === "debug"
    //) {
    await this._write(process.stdout, _info, args);
    //}
  }

  async warn(...args: any[]) {
    await this._write(process.stderr, _warn, args);
  }

  /**
   * Modified/renamed version of vitest-preview debug function
   * to save the file in a different location
   */
  async preview() {
    const CACHE_FOLDER = path.join(process.cwd(), 'data', '.vitest-preview');
    //content directly copied from vitest-preview to change the cache folder
    function createCacheFolderIfNeeded() {
      if (!fs.existsSync(CACHE_FOLDER)) {
        fs.mkdirSync(CACHE_FOLDER, {
          recursive: true,
        });
      }
    }

    function debug() {
      createCacheFolderIfNeeded();
      fs.writeFileSync(
        path.join(CACHE_FOLDER, 'index.html'),
        document.documentElement.outerHTML,
      );
    }
    //end of copied code
    this.info("Generating preview.");
    if (debugEnabled) {
      //debug mode enables Tree View, which is rendered asynchonously
      //so let's wait a bit before generating the preview
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    debug();
  }

}
