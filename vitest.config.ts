import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src'],
        exclude: ['dist'],
        coverage: {
            include: ['src'],
        },
    },
});
