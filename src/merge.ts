import fs from 'node:fs/promises';
import path from 'node:path';

import { type FSWatcher, watch } from 'chokidar';
import { glob } from 'tinyglobby';
import type { Logger, WebSocketServer } from 'vite';

import type { Merger, Mergers } from './mergers.js';
import { exists } from './util.js';

export type ResolveOptions = {
    root: string;
    outputRoot: string;
    inputs: string[];
    output?: string;
};

export const resolve = async ({ root, outputRoot, inputs, output }: ResolveOptions) => {
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

export type MergeOptions = {
    logger: Logger;
    debug?: boolean;

    inputPaths: string[];
    outputPath: string;
    mergers?: Mergers;
};

export const merge = async ({ logger, debug, inputPaths, outputPath, mergers = {} }: MergeOptions) => {
    if (debug) {
        logger.info(`Merging into "${outputPath}".`);
    }

    for (const inputPath of inputPaths) {
        const process = async (file: string | null) => {
            await copyOrMerge(inputPath, outputPath, file, mergers);
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

export type WatchAndMergeOptions = {
    logger: Logger;
    ws: WebSocketServer;

    debug?: boolean;
    reload?: boolean;

    inputPaths: string[];
    outputPath: string;
    mergers?: Mergers;
};

export const watchAndMerge = ({
    logger,
    ws,
    debug,
    reload,
    inputPaths,
    outputPath,
    mergers = {},
}: WatchAndMergeOptions) => {
    const process = async (file: string) => {
        await fs.rm(path.resolve(outputPath, file), {
            force: true,
        });

        for (const inputPath of inputPaths) {
            if (!(await exists(path.resolve(inputPath, file)))) {
                continue;
            }

            await copyOrMerge(inputPath, outputPath, file, mergers);
        }

        if (reload) {
            ws.send({ type: 'full-reload', path: '*' });
        }
    };

    const watchers: FSWatcher[] = [];

    for (const inputPath of inputPaths) {
        const watcher = watch(inputPath, {
            cwd: inputPath,
            ignoreInitial: true,
        })
            .on('add', (file) => {
                if (debug) {
                    logger.info(`Added "${path.resolve(inputPath, file)}".`);
                }

                void process(file);
            })
            .on('change', (file) => {
                if (debug) {
                    logger.info(`Changed "${path.resolve(inputPath, file)}".`);
                }

                void process(file);
            })
            .on('unlink', (file) => {
                if (debug) {
                    logger.info(`Removed "${path.resolve(inputPath, file)}".`);
                }

                void process(file);
            })
            .on('error', (error) => {
                logger.error(String(error));
            });

        if (debug) {
            logger.info(`Started watcher for "${inputPath}".`);
        }

        watchers.push(watcher);
    }

    return async () => {
        await Promise.all(watchers.map((watcher) => watcher.close()));

        if (debug) {
            logger.info('Closed watchers.');
        }
    };
};

const copyOrMerge = async (inputPath: string, outputPath: string, file: string | null, mergers: Mergers) => {
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
