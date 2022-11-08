import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'path';
import fs from 'fs';
import { replaceCodePlugin } from 'vite-plugin-replace';
import babel from '@rollup/plugin-babel';



//copied from lexical-playground/vite.config.js, but there has to be a better way to solve this...
const moduleResolution = [
    {
        find: /lexical$/,
        replacement: path.resolve('../lexical/packages/lexical/src/index.ts'),
    },
    {
        find: '@lexical/clipboard',
        replacement: path.resolve('../lexical/packages/lexical-clipboard/src/index.ts'),
    },
    {
        find: '@lexical/selection',
        replacement: path.resolve('../lexical/packages/lexical-selection/src/index.ts'),
    },
    {
        find: '@lexical/text',
        replacement: path.resolve('../lexical/packages/lexical-text/src/index.ts'),
    },
    {
        find: '@lexical/headless',
        replacement: path.resolve('../lexical/packages/lexical-headless/src/index.ts'),
    },
    {
        find: '@lexical/html',
        replacement: path.resolve('../lexical/packages/lexical-html/src/index.ts'),
    },
    {
        find: '@lexical/hashtag',
        replacement: path.resolve('../lexical/packages/lexical-hashtag/src/index.ts'),
    },
    {
        find: '@lexical/history',
        replacement: path.resolve('../lexical/packages/lexical-history/src/index.ts'),
    },
    {
        find: '@lexical/list',
        replacement: path.resolve('../lexical/packages/lexical-list/src/index.ts'),
    },
    {
        find: '@lexical/file',
        replacement: path.resolve('../lexical/packages/lexical-file/src/index.ts'),
    },
    {
        find: '@lexical/table',
        replacement: path.resolve('../lexical/packages/lexical-table/src/index.ts'),
    },
    {
        find: '@lexical/offset',
        replacement: path.resolve('../lexical/packages/lexical-offset/src/index.ts'),
    },
    {
        find: '@lexical/utils',
        replacement: path.resolve('../lexical/packages/lexical-utils/src/index.ts'),
    },
    {
        find: '@lexical/code',
        replacement: path.resolve('../lexical/packages/lexical-code/src/index.ts'),
    },
    {
        find: '@lexical/plain-text',
        replacement: path.resolve('../lexical/packages/lexical-plain-text/src/index.ts'),
    },
    {
        find: '@lexical/rich-text',
        replacement: path.resolve('../lexical/packages/lexical-rich-text/src/index.ts'),
    },
    {
        find: '@lexical/dragon',
        replacement: path.resolve('../lexical/packages/lexical-dragon/src/index.ts'),
    },
    {
        find: '@lexical/link',
        replacement: path.resolve('../lexical/packages/lexical-link/src/index.ts'),
    },
    {
        find: '@lexical/overflow',
        replacement: path.resolve('../lexical/packages/lexical-overflow/src/index.ts'),
    },
    {
        find: '@lexical/markdown',
        replacement: path.resolve('../lexical/packages/lexical-markdown/src/index.ts'),
    },
    {
        find: '@lexical/mark',
        replacement: path.resolve('../lexical/packages/lexical-mark/src/index.ts'),
    },
    {
        find: '@lexical/yjs',
        replacement: path.resolve('../lexical/packages/lexical-yjs/src/index.ts'),
    },
    {
        find: 'shared',
        replacement: path.resolve('../lexical/packages/shared/src'),
    },
];
// Lexical React
[
    'LexicalTreeView',
    'LexicalComposer',
    'LexicalComposerContext',
    'useLexicalIsTextContentEmpty',
    'useLexicalTextEntity',
    'LexicalContentEditable',
    'LexicalNestedComposer',
    'LexicalHorizontalRuleNode',
    'LexicalDecoratorBlockNode',
    'LexicalBlockWithAlignableContents',
    'useLexicalNodeSelection',
    'LexicalMarkdownShortcutPlugin',
    'LexicalCharacterLimitPlugin',
    'LexicalHashtagPlugin',
    'LexicalErrorBoundary',
    'LexicalPlainTextPlugin',
    'LexicalRichTextPlugin',
    'LexicalClearEditorPlugin',
    'LexicalCollaborationContext',
    'LexicalCollaborationPlugin',
    'LexicalHistoryPlugin',
    'LexicalTypeaheadMenuPlugin',
    'LexicalTablePlugin',
    'LexicalLinkPlugin',
    'LexicalListPlugin',
    'LexicalCheckListPlugin',
    'LexicalAutoFocusPlugin',
    "LexicalTableOfContents__EXPERIMENTAL",
    'LexicalAutoLinkPlugin',
    'LexicalAutoEmbedPlugin',
    'LexicalOnChangePlugin',
    'LexicalAutoScrollPlugin',
].forEach((module) => {
    let resolvedPath = path.resolve(`../lexical/packages/lexical-react/src/${module}.ts`);

    if (fs.existsSync(resolvedPath)) {
        moduleResolution.push({
            find: `@lexical/react/${module}`,
            replacement: resolvedPath,
        });
    } else {
        resolvedPath = path.resolve(`../lexical/packages/lexical-react/src/${module}.tsx`);
        moduleResolution.push({
            find: `@lexical/react/${module}`,
            replacement: resolvedPath,
        });
    }
});

export default defineConfig({
    server: {
        //host: "0.0.0.0",
        port: 3000
    },
    plugins: [
        replaceCodePlugin({
            replacements: [
                {
                    from: /__DEV__/g,
                    to: 'true',
                },
            ],
        }),
        babel({
            babelHelpers: 'bundled',
            babelrc: false,
            configFile: false,
            exclude: '/**/node_modules/**',
            extensions: ['jsx', 'js', 'ts', 'tsx', 'mjs'],
            plugins: [
                '@babel/plugin-transform-flow-strip-types',
                [
                    require('../lexical/scripts/error-codes/transform-error-messages'),
                    {
                        noMinify: true,
                    },
                ],
            ],
            presets: ['@babel/preset-react'],
        }),
        react(),
    ],
    resolve: {
        alias: moduleResolution,
    },
    build: {
        outDir: 'build',
        rollupOptions: {
            input: {
                main: new URL('./index.html', import.meta.url).pathname,
                split: new URL('./split/index.html', import.meta.url).pathname,
            },
        },
    },
});
