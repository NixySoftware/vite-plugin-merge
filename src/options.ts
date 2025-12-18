import type { Logger } from 'vite';

import type { Merger } from './mergers.js';

export type InternalOptions = {
    root: string;
    outputRoot: string;
    logger: Logger;

    debug?: boolean;

    inputs: string[];
    output?: string;
    mergers?: Record<string, Merger>;
};
