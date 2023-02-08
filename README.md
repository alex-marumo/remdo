TODO create lint test case

TODO /home/dev/project/lexical/packages/lexical-playground/vite.config.js contains problematic **DEV** replacement
try to remove and reinstall warning
TODO remove autocomplete

TODO https://github.com/welldone-software/why-did-you-render
TODO https://dmitripavlutin.com/react-usecallback/
TODO try using lexical dev tools
TODO https://lexical.dev/docs/concepts/dom-events#3-use-nodeeventplugin
TODO https://github.com/facebook/lexical/discussions
use that in own project
TODO doxygen or something similar
TODO https://code.visualstudio.com/Docs/languages/javascript#_code-actions-on-save
$nodesOfType + it's flat search
TODO work on listeners (for example to update content and structure of breadcrumbs)

TODO lexical bugs
getActiveEditorState() (not available publicly) returns a different state than editor.getEditorState() which can cause problems if someone modifies state in editor.update()

think about nested lists and CSS

//TODO reading or just passing editor state should be enough, re-check in the newer lexical version
editor.update(() => {
key = $getNearestNodeFromDOMNode(event.target).getKey();
});

throw Error("error") in update works, but throw "error" is silently eaten

go through a fresh install to check if .devcontainer folder is needed at all (possibly test playwright headed mode at the same time)

TODO move to yarn

git submodule update --init --recursive

TODO improve tiny-invariant in production

Watched lexical issues:
https://github.com/facebook/lexical/issues/3763
https://github.com/facebook/lexical/issues/3670
https://github.com/facebook/lexical/issues/3567
https://github.com/facebook/lexical/issues/3433
https://github.com/facebook/lexical/issues/3255
https://github.com/facebook/lexical/issues/3085
https://github.com/facebook/lexical/issues/2951
https://github.com/facebook/lexical/issues/2845
https://github.com/facebook/lexical/issues/2791
https://github.com/facebook/lexical/issues/2127
https://github.com/facebook/lexical/issues/1707
https://github.com/facebook/lexical/issues/1604
https://github.com/facebook/lexical/issues/1311


playwright
DEBUG=* 
DEBUG=pw:browser,pw:api