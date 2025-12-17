import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import sirv from 'sirv';
import type { Plugin } from 'vite';

import { merge } from './merge.js';
import type { MergePluginOptions } from './plugin.js';

export const serve = (options: MergePluginOptions): Plugin => {
    let tempPath: string;

    return {
        name: 'vite-plugin-merge:serve',
        apply: 'serve',
        async configureServer(server) {
            tempPath = await fs.mkdtemp(path.join(os.tmpdir(), 'vite-plugin-merge-'));

            await merge({
                root: server.config.root,
                outputRoot: tempPath,
                ...options,
            });

            // TODO: Watch inputs

            server.middlewares.use(sirv(tempPath));
        },
        async closeBundle() {
            if (tempPath) {
                await fs.rmdir(tempPath);
            }
        },
    };
};
