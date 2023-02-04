import { execSync } from "child_process";
import { test } from "@playwright/test";

test("find todos", async ({ page }) => {
  const pattern = "TODO\\|FIXME"; //split the pattern, so it's not reported by this very test
  const grepCmd = `grep -riI "${pattern}" \
  --exclude-dir=".git" \
  --exclude-dir="node_modules" \
  --exclude-dir="lexical" \
  --exclude-dir="playwright-report" \
  --exclude="package-lock.json" \
  --exclude="todos.spec.js" \
  .`;
  const cmd = grepCmd + " || [ $? = 1 ]"; //do not fail if grep doesn't find anything and returns 1
  const res = execSync(cmd).toString();
  if (res.length > 0) {
    console.warn("found some TODO or FIXME");
    console.log(res);
    test.fixme();
  }
});
