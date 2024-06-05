import { getTests } from "@vitest/runner/utils";
import { File, UserConsoleLog, Vitest } from "vitest";
import { DefaultReporter } from "vitest/reporters";

export default class PerformanceReporter extends DefaultReporter {
  onCollected() {}

  onFinished(files?: File[], errors?: unknown[]): Promise<void> {
    // print summary only if there are failed tests
    const failed = getTests(files).find((t) => t.result?.state === "fail");
    if (failed) {
      this.reportSummary(files, errors);
    }
    return;
  }

  onInit(ctx: Vitest) {
    // disable the initial banner
    ctx.logger.printBanner = () => {};
    super.onInit(ctx);
  }

  onUserConsoleLog(log: UserConsoleLog) {
    // don't print test info, just the message
    const stream =
      log.type === "stdout"
        ? this.ctx.logger.outputStream
        : this.ctx.logger.errorStream;
    stream.write(log.content);
  }
}
