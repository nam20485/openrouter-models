import { describe, expect, it } from 'vitest';

import type { Model } from '../types';
import { getModelPageUrl } from './modelUrls';

const buildMeta = (overrides: Partial<Model['meta']> = {}): Model['meta'] => ({
    provider: overrides.provider ?? 'provider',
    slug: overrides.slug ?? 'provider/model',
    createdAt: overrides.createdAt,
});

describe('getModelPageUrl', () => {
    it('uses the canonical slug when available', () => {
        const url = getModelPageUrl({
            id: 'provider/model',
            meta: buildMeta(),
        });

        expect(url).toBe('https://openrouter.ai/models/provider/model');
    });

    it('encodes each slug segment safely', () => {
        const url = getModelPageUrl({
            id: 'provider/model special',
            meta: buildMeta({ slug: 'provider/model special' }),
        });

        expect(url).toBe('https://openrouter.ai/models/provider/model%20special');
    });
});
