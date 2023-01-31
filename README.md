TODO create lint test case

TODO https://github.com/welldone-software/why-did-you-render
TODO https://dmitripavlutin.com/react-usecallback/
TODO add breadcrumb tests once they work correctly
TODO try using lexical dev tools
TODO https://lexical.dev/docs/concepts/dom-events#3-use-nodeeventplugin
TODO https://lexical.dev/docs/concepts/node-replacement
TODO https://github.com/facebook/lexical/discussions
    use that in own project
TODO doxygen or something similar
TODO https://code.visualstudio.com/Docs/languages/javascript#_code-actions-on-save
$nodesOfType + it's flat search

root change improvements
    TODO work on the following line in LexicalReconcilation
        if (nextNode.updateDOM(prevNode, dom, activeEditorConfig) || key !== 'root') {
    current - reconciliation changes
        debug TODO reconcileNode('root', null); and see how it works
            the goal is to skip adding unnecessary divs or avoid using setState
    try using JS to play with dom structure
    use css
        .editor-input > ul {
        visibility: hidden;
        position: absolute;
        top: 0px;
        }

        .temp-root {
        visibility: visible;
        margin-left: 50px;
        position: absolute;
        }
        requires fixing the space that tem-root takes (currently it's size is ignored because of position:absolute)
            https://github.com/react-component/resize-observer/ could be used for that purpose
    

TODO lexical bugs
getActiveEditorState() (not available publicly) returns a different state than editor.getEditorState() which can cause problems if someone modifies state in editor.update()

think about nested lists and CSS

//TODO read or just passinge editor state should be enough, re-check in the newer lexical version
      editor.update(() => {
        key = $getNearestNodeFromDOMNode(event.target).getKey();
      });

git submodule update --init --recursive

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