import type { Plugin, ResolvedConfig } from 'vite';

import { internalMerge } from './merge.js';
import { type MergePluginOptions } from './plugin.js';

export const build = ({ hook = 'generateBundle', ...options }: MergePluginOptions): Plugin => {
    let config: ResolvedConfig;
    let finished = false;

    return {
        name: 'vite-plugin-merge:build',
        apply: 'build',
        buildEnd() {
            // Reset
            finished = false;
        },
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        async [hook]() {
            // Run once even if multiple the hook is called multiple times.
            if (finished) {
                return;
            }
            finished = true;

            await internalMerge({
                root: config.root,
                outputRoot: config.build.outDir,
                ...options,
            });
        },
    };
};
