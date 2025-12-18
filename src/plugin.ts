import type { Plugin } from 'vite';

import { type BuildOptions, build } from './build.js';
import { type ServeOptions, serve } from './serve.js';

export type MergePluginOptions = BuildOptions & ServeOptions;

export const merge = (options: MergePluginOptions): Plugin[] => {
    return [build(options), serve(options)];
};

export const mergePlugin = merge;
