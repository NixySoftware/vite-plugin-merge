import type { Merger } from './mergers.js';

export type InternalOptions = {
    root: string;
    outputRoot: string;

    inputs: string[];
    output?: string;
    mergers?: Record<string, Merger>;
};
