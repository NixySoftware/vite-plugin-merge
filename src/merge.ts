import fs from 'node:fs/promises';
import path from 'node:path';

import { glob } from 'tinyglobby';

import type { Merger } from './mergers.js';
import type { InternalOptions } from './options.js';

const resolve = async ({
    root,
    outputRoot,
    inputs,
    output,
}: Pick<InternalOptions, 'root' | 'outputRoot' | 'inputs' | 'output'>) => {
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

    return {
        inputPaths,
        outputPath,
    };
};

export const merge = async ({ mergers = {}, ...options }: InternalOptions) => {
    const { inputPaths, outputPath } = await resolve(options);

    for (const inputPath of inputPaths) {
        const process = async (file: string | null) => {
            const inputFilePath = file ? path.join(inputPath, file) : inputPath;
            const outputFilePath = file ? path.join(outputPath, file) : outputPath;

            if (await exists(outputFilePath)) {
                const extension = path.extname(inputFilePath);
                const merger = mergers[extension];

                if (merger) {
                    await mergeWithMerger(inputFilePath, outputFilePath, merger);

                    return;
                }
            }

            await fs.mkdir(path.dirname(outputFilePath), {
                recursive: true,
            });
            await fs.copyFile(inputFilePath, outputFilePath);
        };

        const stats = await fs.stat(inputPath);

        if (stats.isDirectory()) {
            const files = await glob(inputPath, {
                cwd: inputPath,
                dot: true,
                onlyDirectories: false,
                onlyFiles: true,
            });

            for (const file of files) {
                await process(file);
            }
        } else if (stats.isFile()) {
            await process(null);
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
