TODO create lint test case

TODO /home/dev/project/lexical/packages/lexical-playground/vite.config.js contains problematic **DEV** replacement
try to remove and reinstall warning

TODO https://github.com/welldone-software/why-did-you-render
TODO https://dmitripavlutin.com/react-usecallback/
TODO try using lexical dev tools
TODO https://lexical.dev/docs/concepts/dom-events#3-use-nodeeventplugin
TODO https://github.com/facebook/lexical/discussions
use that in own project
TODO https://code.visualstudio.com/Docs/languages/javascript#_code-actions-on-save
$nodesOfType + it's flat search
TODO work on listeners (for example to update content and structure of breadcrumbs)

FIXME very wired behavior with url pointing to an not existing note

TODO lexical bugs
getActiveEditorState() (not available publicly) returns a different state than editor.getEditorState() which can cause problems if someone modifies state in editor.update()
Vite and it's HMR cause errorOnKlassMismatch when saving custom's node source file
think about nested lists and CSS
throw Error("error") in update works, but throw "error" is silently eaten

//TODO reading or just passing editor state should be enough, re-check in the newer lexical version
editor.update(() => {
key = $getNearestNodeFromDOMNode(event.target).getKey();
});

there is no $isLexicalNode function and there is no way to implement is on your own

TODO consider changing rootElement to ul/li instead of adjusting schema in rootTransform
TODO refactor dom event listeners

tsconfig options: https://vitejs.dev/guide/features.html#typescript 

https://github.com/nfl/react-helmet

runtime (also replaces npm/yarn)
    bun
    deno

https://www.npmjs.com/package/match-sorter

git submodule update --init --recursive

TODO improve tiny-invariant in production
potentially use https://github.com/speedskater/babel-plugin-rewire
TODO add a warning about jsdom/querySelectorAll, potentially also using rewire

TODO fail all kinds of tests if there is an exception in browser's console

TODO unit tests cause browser to disconnect, fix reconnecting


TODO https://mdbootstrap.com/


Watched lexical issues:
list: https://github.com/facebook/lexical/issues/2951
schema: https://github.com/facebook/lexical/issues/3833
https://github.com/facebook/lexical/issues/3763
https://github.com/facebook/lexical/issues/3670
https://github.com/facebook/lexical/issues/3567
https://github.com/facebook/lexical/issues/3433
https://github.com/facebook/lexical/issues/3255
https://github.com/facebook/lexical/issues/3085
https://github.com/facebook/lexical/issues/2845
https://github.com/facebook/lexical/issues/2791
https://github.com/facebook/lexical/issues/2127
https://github.com/facebook/lexical/issues/1707
https://github.com/facebook/lexical/issues/1604
https://github.com/facebook/lexical/issues/1311

playwright
DEBUG=\*
DEBUG=pw:browser,pw:api
