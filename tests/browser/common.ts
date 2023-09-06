//TODO clear report that this breaks if lexical-playground dependencies are installed
import { test as base } from "@playwright/test";

const SKIP_CONSOLE_MESSAGES = [
  "%cDownload the React DevTools for a better development experience: https://reactjs.org/link/react-devtools font-weight:bold",
  "Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools",
  "[vite] connecting...",
  "[vite] connected.",
];

export const test = base.extend({
  page: async ({ page }, use) => {
    page.on("console", (message) => {
      if (!SKIP_CONSOLE_MESSAGES.includes(message.text())) {
        console.log("Browser:", message);
      }
      if (["warning", "error"].includes(message.type())) {
        console.error(`${message.type} inside the browser: `);
        throw Error(message.text());
      }
    });

    page.on("pageerror", (err) => {
      console.error("Error inside the browser: ", err.message);
      throw err;
    });

    await use(page);
  },
});
