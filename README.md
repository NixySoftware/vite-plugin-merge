# vite-plugin-merge

Vite plugin which merges multiple input directories into the output directory.

## Installation

```shell
npm install --save-dev vite-plugin-merge
```

## Example

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

## License

This project is available under the [MIT license](LICENSE.md).
