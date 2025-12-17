import type { Plugin, Rollup } from 'vite';

import { build } from './build.js';
import type { InternalOptions } from './options.js';
import { serve } from './serve.js';

export type MergePluginOptions = {
    hook?: keyof Rollup.PluginHooks;
} & Pick<InternalOptions, 'inputs' | 'output' | 'mergers'>;

export const merge = (options: MergePluginOptions): Plugin[] => {
    return [build(options), serve(options)];
};

export const mergePlugin = merge;
