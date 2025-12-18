import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import sirv from 'sirv';
import type { Plugin, ResolvedConfig } from 'vite';

import { type ResolveOptions, type WatchAndMergeOptions, merge, resolve, watchAndMerge } from './merge.js';

export type ServeOptions = {
    serve?: {
        reload?: boolean;
    };
} & Pick<ResolveOptions, 'inputs' | 'output'> &
    Pick<WatchAndMergeOptions, 'debug' | 'mergers'>;

export const serve = ({ serve: { reload = false } = {}, debug, inputs, output, mergers }: ServeOptions): Plugin => {
    let config: ResolvedConfig;
    let tempPath: string | null = null;
    let closeWatcher: (() => Promise<void>) | null = null;

    return {
        name: 'vite-plugin-merge:serve',
        apply: 'serve',
        async configureServer(server) {
            config = server.config;

            tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-merge-'));

            if (debug) {
                config.logger.info(`Created merge directory "${tempPath}".`);
            }

            const { inputPaths, outputPath } = await resolve({
                root: server.config.root,
                outputRoot: tempPath,
                inputs,
                output,
            });

            await merge({
                logger: server.config.logger,

                debug,

                inputPaths,
                outputPath,
                mergers,
            });

            closeWatcher = watchAndMerge({
                logger: server.config.logger,
                ws: server.ws,

                reload,

                inputPaths,
                outputPath,
            });

            server.middlewares.use(
                sirv(tempPath, {
                    dev: true,
                }),
            );
        },
        async closeBundle() {
            if (closeWatcher) {
                const close = closeWatcher;
                closeWatcher = null;

                await close();
            }

            if (tempPath) {
                const path = tempPath;
                tempPath = null;

                await fs.rm(path, {
                    recursive: true,
                });

                if (debug) {
                    config.logger.info(`Removed merge directory "${path}".`);
                }
            }
        },
    };
};
