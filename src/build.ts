import type { Plugin, ResolvedConfig, Rollup } from 'vite';

import { type MergeOptions, type ResolveOptions, merge, resolve } from './merge.js';

export type BuildOptions = {
    build?: {
        hook?: keyof Rollup.PluginHooks;
    };
} & Pick<ResolveOptions, 'inputs' | 'output'> &
    Pick<MergeOptions, 'debug' | 'mergers'>;

export const build = ({
    build: { hook = 'generateBundle' } = {},
    debug,
    inputs,
    output,
    mergers,
}: BuildOptions): Plugin => {
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

            const { inputPaths, outputPath } = await resolve({
                root: config.root,
                outputRoot: config.build.outDir,
                inputs,
                output,
            });

            await merge({
                logger: config.logger,

                debug,

                inputPaths,
                outputPath,
                mergers,
            });
        },
    };
};
