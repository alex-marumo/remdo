import { UserConsoleLog, Vitest } from "vitest";
import { DefaultReporter } from "vitest/reporters";

export default class PerformanceReporter extends DefaultReporter {
  onCollected() {
  }

  onFinished(): Promise<void> {
    // Don't print the summary
    return;
  }

  onInit(ctx: Vitest) {
    // Disable the banner
    ctx.logger.printBanner = () => {};
    super.onInit(ctx);
  }

  onUserConsoleLog(log: UserConsoleLog) {
    //Don't print test info, just the message
    const stream =
      log.type === "stdout"
        ? this.ctx.logger.outputStream
        : this.ctx.logger.errorStream;
    stream.write(log.content);
  }
}
