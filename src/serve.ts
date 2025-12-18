import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import sirv from 'sirv';
import type { Plugin, ResolvedConfig } from 'vite';

import { merge } from './merge.js';
import type { MergePluginOptions } from './plugin.js';

export const serve = (options: MergePluginOptions): Plugin => {
    let config: ResolvedConfig;
    let tempPath: string | null = null;

    return {
        name: 'vite-plugin-merge:serve',
        apply: 'serve',
        async configureServer(server) {
            config = server.config;

            tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-merge-'));

            if (options.debug) {
                config.logger.info(`Created merge directory "${tempPath}".`);
            }

            await merge({
                root: server.config.root,
                outputRoot: tempPath,
                logger: server.config.logger,
                ...options,
            });

            // TODO: Watch inputs

            server.middlewares.use(sirv(tempPath));
        },
        async closeBundle() {
            if (tempPath) {
                const path = tempPath;
                tempPath = null;

                await fs.rm(path, {
                    recursive: true,
                });

                if (options.debug) {
                    config.logger.info(`Removed merge directory "${path}".`);
                }
            }
        },
    };
};
