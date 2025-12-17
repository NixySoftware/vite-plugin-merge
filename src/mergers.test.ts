import { describe, expect, test } from 'vitest';

import { concatMerger, overwriteMerger } from './mergers.js';

describe('overwriteMerger', () => {
    test('should return the latter', () => {
        expect(overwriteMerger.merge(Buffer.from('a'), Buffer.from('b'))).toEqual(Buffer.from('b'));
    });
});

describe('concatMerger', () => {
    test('should concat the former and latter', () => {
        expect(concatMerger.merge('a', 'b')).toBe('ab');
    });
});
