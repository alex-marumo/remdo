import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

import * as playgroundConfig from "./lexical/packages/lexical-playground/vite.config";

//playground vite configuration contains a lot of module replacements
//the idea is to reuse them after adjusting to a different dir structure
var playgroundResolveAlias = playgroundConfig.default.resolve.alias.map(
  (module) => {
    //playground is nested in lexical/packages while this file exist outside
    //of lexical dir structure, let's change this
    var resolvedPath = module.replacement.replace(
      path.resolve(".."),
      path.resolve("./lexical/packages")
    );
    if (!fs.existsSync(resolvedPath)) {
      //playground config replaces .ts to .tsx whenever react/*.ts file
      //doesn't exist, the problem is that this check is done before we
      //have a chance to adjust the dir structure (see above), that's why
      //some of this replacements have to be reverted
      resolvedPath = resolvedPath.replace(".tsx", ".ts");
    }
    return {
      find: module.find,
      replacement: resolvedPath,
    };
  }
);

//finally let's add a missing entries
//do it at the begining of the array so list/utils entry takes priority
playgroundResolveAlias.unshift(
  {
    find: "@lexical/react/LexicalTabIndentationPlugin",
    replacement: path.resolve(
      "./lexical/packages/lexical-react/src/LexicalTabIndentationPlugin.tsx"
    ),
  },
  {
    find: "@lexical/list/utils",
    replacement: path.resolve("./lexical/packages/lexical-list/src/utils.ts"),
  }
);

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: playgroundConfig.default.plugins,
  resolve: {
    alias: playgroundResolveAlias,
  },
  build: playgroundConfig.default.build,
});
