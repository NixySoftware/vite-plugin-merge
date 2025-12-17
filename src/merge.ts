import fs from 'node:fs/promises';
import path from 'node:path';

import { glob } from 'tinyglobby';

import type { Merger } from './mergers.js';

export type InternalMergeOptions = {
    root: string;
    outputRoot: string;

    inputs: string[];
    output?: string;
    mergers?: Record<string, Merger>;
};

export const internalMerge = async ({ root, outputRoot, inputs, output, mergers = {} }: InternalMergeOptions) => {
    const inputPaths = (
        await glob(inputs, {
            cwd: root,
            dot: true,
            expandDirectories: false,
            onlyDirectories: false,
            onlyFiles: false,
        })
    ).map((inputPath) => path.resolve(root, inputPath));

    const outputPath = output ? path.resolve(root, outputRoot, output) : path.resolve(root, outputRoot);

    for (const inputPath of inputPaths) {
        const stats = await fs.stat(inputPath);
        if (stats.isDirectory()) {
            const files = await glob(inputPath, {
                cwd: inputPath,
                dot: true,
                onlyDirectories: false,
                onlyFiles: true,
            });

            for (const file of files) {
                const inputFilePath = path.join(inputPath, file);
                const outputFilePath = path.join(outputPath, file);

                if (await exists(outputFilePath)) {
                    const extension = path.extname(inputFilePath);
                    const merger = mergers[extension];

                    if (merger) {
                        await mergeWithMerger(inputFilePath, outputFilePath, merger);

                        continue;
                    }
                }

                await fs.mkdir(path.dirname(outputFilePath), {
                    recursive: true,
                });
                await fs.copyFile(inputFilePath, outputFilePath);
            }
        } else if (stats.isFile()) {
            // TODO
        } else {
            throw new Error(`Path "${inputPath}" is not a file or directory.`);
        }
    }
};

const exists = async (path: string): Promise<boolean> => {
    try {
        await fs.access(path, fs.constants.F_OK);
        return true;
    } catch (err) {
        if (err !== null && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
            return false;
        }

        throw err;
    }
};

const mergeWithMerger = async (inputPath: string, outputhPath: string, merger: Merger) => {
    switch (merger.encoding) {
        case null: {
            const input = await fs.readFile(inputPath, { encoding: merger.encoding });
            const output = await fs.readFile(outputhPath, { encoding: merger.encoding });

            const merged = merger.merge(output, input);

            await fs.writeFile(outputhPath, merged, {
                encoding: merger.encoding,
            });

            break;
        }
        case 'utf-8': {
            const input = await fs.readFile(inputPath, { encoding: merger.encoding });
            const output = await fs.readFile(outputhPath, { encoding: merger.encoding });

            const merged = merger.merge(output, input);

            await fs.writeFile(outputhPath, merged, {
                encoding: merger.encoding,
            });

            break;
        }
    }
};
