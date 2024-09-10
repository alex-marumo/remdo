import { UserConsoleLog, Vitest } from 'vitest';
import { BasicReporter } from 'vitest/reporters';

export default class MinimalReporter extends BasicReporter {
  onInit(ctx: Vitest) {
    ctx.logger.printBanner = () => {
      console.log("Starting...");
    };
    super.onInit(ctx);
  }

  reportTestSummary(): Promise<void> {
    console.log('Done, waiting for changes...');
    return new Promise(() => {});
  }

  onTaskUpdate() {
  }

  onWatcherStart(): Promise<void> {
    return new Promise(() => {});
  }

  onCollected() {
  }

  onUserConsoleLog(log: UserConsoleLog) {
    if (!this.shouldLog(log)) {
      return;
    }
    const output
      = log.type === 'stdout'
        ? this.ctx.logger.outputStream
        : this.ctx.logger.errorStream;
    const write = (msg: string) => (output as any).write(msg);

    write(log.content);
  }
}
