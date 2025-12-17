import { deepmerge } from 'deepmerge-ts';

export type Merger =
    | {
          encoding: null;
          merge: (a: Buffer, b: Buffer) => Buffer;
      }
    | {
          encoding: 'utf-8';
          merge: (a: string, b: string) => string;
      };

export const overwriteMerger: Merger = {
    encoding: null,
    merge: (_a, b) => b,
};

export const concatMerger: Merger = {
    encoding: 'utf-8',
    merge: (a, b) => a.concat(b),
};

export type JsonMergerOptions = {
    deep?: boolean;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replacer?: (this: any, key: string, value: any) => any;
    space?: string | number;
};

export const jsonMerger = ({ deep = false, replacer, space }: JsonMergerOptions = {}): Merger => {
    const merge = deep ? deepmerge : Object.assign;

    return {
        encoding: 'utf-8',
        merge(a, b) {
            return JSON.stringify(merge(JSON.parse(a), JSON.parse(b)), replacer, space);
        },
    };
};
