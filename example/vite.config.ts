import { defineConfig } from 'vite';

import { jsonMerger, merge } from '../dist/index.js';

export default defineConfig({
    plugins: [
        merge({
            debug: true,
            inputs: ['./modules/**/locales'],
            output: 'assets/locales',
            mergers: {
                '.json': jsonMerger(),
            },
        }),
    ],
});
