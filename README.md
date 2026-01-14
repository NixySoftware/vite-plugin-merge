# vite-plugin-merge

![NPM Version](https://img.shields.io/npm/v/vite-plugin-merge)
![GitHub License](https://img.shields.io/github/license/NixySoftware/vite-plugin-merge)

Vite plugin which merges multiple input directories into the output directory.

Works for both build and serve modes.

## Installation

```shell
# npm
npm install --save-dev vite-plugin-merge

# Yarn
yarn add --dev vite-plugin-merge

# pnpm
pnpm add --save-dev vite-plugin-merge
```

## Example

**Input**

```
.
├── modules
│   ├── a
│   │   └── locales
│   │       ├── en
│   │       │   └── common.json
│   │       └── nl
│   │           └── common.json
│   └── b
│       └── locales
│           ├── en
│           │   └── common.json
│           └── nl
│               └── common.json
├── src
│   └── index.ts
└── vite.config.ts
```

**Configuration**

```ts
import { defineConfig } from 'vite';
import { jsonMerger, merge } from 'vite-plugin-merge';

export default defineConfig({
    plugins: [
        merge({
            inputs: ['./modules/**/locales'],
            output: 'assets/locales',
            mergers: {
                '.json': jsonMerger({
                    deep: true,
                }),
            },
        }),
    ],
});
```

**Output**

```
.
├── dist
│   ├── assets
│   │   ├── index-B5Qt9EMX.js
│   │   └── locales
│   │       ├── en
│   │       │   └── common.json
│   │       └── nl
│   │           └── common.json
│   └── index.html
└── vite.config.ts
```

## Options

### `inputs`

List of input files or directories. Relative paths are resolved relative to the Vite [`root`](https://vite.dev/config/shared-options#root). Supports glob patterns, see [`tinyglobby`](https://www.npmjs.com/package/tinyglobby) for the syntax.

### `output`

Ouput file or directory. Relative paths are resolved relative to the Vite [`root`](https://vite.dev/config/shared-options#root) and [`outDir`](https://vite.dev/config/build-options#build-outdir).

### `mergers`

Optional map of mergers. The keys are file extensions, including the dot. The values are mergers. If multiple input files attempt to write to the same output file, a merger can be to customize the behaviour. If no merger is specified, the last input file overwrites other input files.

A merger is defined as follows:

```ts
type Merger =
    | {
          encoding: null;
          merge: (a: Buffer, b: Buffer) => Buffer;
      }
    | {
          encoding: 'utf-8';
          merge: (a: string, b: string) => string;
      };
```

Serveral built-in mergers are available.

#### `overwriteMerger`

The latter file will overwrite the former file. Essentially the same as not specifying a merger at all.

```ts
merge({
    mergers: {
        '.bin': overwriteMerger(),
    },
});
```

#### `concatMerger`

The former and latter file are concatenated.

```ts
merge({
    mergers: {
        '.txt': concatMerger(),
    },
});
```

#### `jsonMerger`

The former and latter file are parsed as JSON, merged and stringified.

```ts
merge({
    mergers: {
        '.json': jsonMerger({
            /**
             * Whether to perform deep or shallow merging.
             * - Shallow uses `Object.assign`.
             * - Deep uses `deepmerge-ts`.
             *
             * Defaults to `false`.
             */
            deep: true,

            /**
             * Passed to `JSON.stringify`.
             *
             * Defaults to `undefined`.
             *
             * @see {@link JSON.stringify}
             */
            replacer: null,

            /**
             * Passed to `JSON.stringify`.
             *
             * Defaults to `undefined`.
             *
             * @see {@link JSON.stringify}
             */
            space: 4,
        }),
    },
});
```

### `build.hook`

[Output generation hook](https://rollupjs.org/plugin-development/#output-generation-hooks) to use. Defaults to `generateBundle`.

### `serve.reload`

Whether to reload the page when an input file changes. Defaults to `false`.

### `debug`

Whether to enable debug logging.

## License

This project is available under the [MIT license](LICENSE.md).
