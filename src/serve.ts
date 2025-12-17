import type { Plugin } from 'vite';

import type { MergePluginOptions } from './plugin.js';

export const serve = (_options: MergePluginOptions): Plugin => {
    return {
        name: 'vite-plugin-merge:serve',
        apply: 'serve',
    };
};
