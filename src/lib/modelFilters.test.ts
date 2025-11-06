import { describe, expect, it } from 'vitest';

import { defaultFilters } from './modelTransforms';
import { describeFilters, filterModels, getProviderOptions, sortModels } from './modelFilters';
import type { FilterState, Model } from '../types';

type ModelOverrides = Partial<Model>;

const buildModel = (overrides: ModelOverrides): Model => ({
    id: 'provider/model',
    name: 'Reference Model',
    description: 'A baseline model for testing.',
    contextLength: 4096,
    pricing: { prompt: 0.002, completion: 0.003, request: null },
    architecture: {
        modality: null,
        input_modalities: null,
        output_modalities: null,
        tokenizer: null,
        instruct_type: null,
    },
    supportedParameters: [],
    topProvider: {
        context_length: 4096,
        max_completion_tokens: null,
        is_moderated: null,
    },
    capabilities: {
        supportsTools: false,
        supportsJson: false,
        supportsVision: false,
        supportsAudio: false,
        freeTier: false,
        requiresModeration: false,
    },
    meta: {
        provider: 'provider',
        slug: 'provider/model',
        createdAt: undefined,
    },
    score: {
        rating: 3.5,
        costScore: 0.5,
        contextScore: 0.5,
        featureScore: 0.5,
    },
    ...overrides,
});

const cloneFilters = (filters: FilterState = defaultFilters): FilterState => ({ ...filters, providers: [...filters.providers] });

describe('filterModels', () => {
    const models = [
        buildModel({
            id: 'openai/gpt',
            name: 'GPT Alpha',
            meta: { provider: 'openai', slug: 'openai/gpt', createdAt: undefined },
            pricing: { prompt: 0.001, completion: 0.002, request: null },
            contextLength: 8192,
            capabilities: {
                supportsTools: true,
                supportsJson: true,
                supportsVision: false,
                supportsAudio: false,
                freeTier: false,
                requiresModeration: true,
            },
            score: { rating: 4.7, costScore: 0.8, contextScore: 0.8, featureScore: 0.6 },
        }),
        buildModel({
            id: 'dummy/vision',
            name: 'Visionary',
            description: 'Handles images',
            meta: { provider: 'dummy', slug: 'dummy/vision', createdAt: undefined },
            pricing: { prompt: 0, completion: 0, request: null },
            contextLength: 2048,
            capabilities: {
                supportsTools: false,
                supportsJson: false,
                supportsVision: true,
                supportsAudio: false,
                freeTier: true,
                requiresModeration: false,
            },
            score: { rating: 4.1, costScore: 1, contextScore: 0.3, featureScore: 0.6 },
        }),
        buildModel({
            id: 'budget/basic',
            name: 'Budget Model',
            meta: { provider: 'budget', slug: 'budget/basic', createdAt: undefined },
            pricing: { prompt: 0.004, completion: 0.006, request: null },
            contextLength: 1024,
            capabilities: {
                supportsTools: false,
                supportsJson: false,
                supportsVision: false,
                supportsAudio: false,
                freeTier: false,
                requiresModeration: false,
            },
            score: { rating: 3.2, costScore: 0.2, contextScore: 0.1, featureScore: 0.2 },
        }),
    ];

    it('filters by search, provider, price, context, and capabilities', () => {
        const filters: FilterState = {
            ...cloneFilters(),
            search: 'vision',
            providers: ['dummy'],
            maxPromptPrice: 0.001,
            minContext: 1000,
            maxContext: 4096,
            supportsVision: true,
            freeOnly: true,
        };

        const result = filterModels(models, filters);
        expect(result).toHaveLength(1);
        const [match] = result;
        expect(match).toBeDefined();
        expect(match?.id).toBe('dummy/vision');
    });

    it('treats null pricing as eligible and returns all providers sorted alphabetically', () => {
        const withNullPrice = buildModel({
            id: 'acme/free',
            name: 'Null Priced',
            pricing: { prompt: null, completion: null, request: null },
            meta: { provider: 'zlast', slug: 'zlast/null', createdAt: undefined },
        });

        const providers = getProviderOptions([...models, withNullPrice]);
        expect(providers).toEqual(['budget', 'dummy', 'openai', 'zlast']);

        const filters = cloneFilters();
        filters.maxPromptPrice = 0.0005;
        const result = filterModels([withNullPrice], filters);
        expect(result).toHaveLength(1);
        const [match] = result;
        expect(match).toBeDefined();
        expect(match?.id).toBe('acme/free');
    });
});

describe('sortModels', () => {
    const models = [
        buildModel({ id: 'a', name: 'A', pricing: { prompt: 0.002, completion: 0.004, request: null }, contextLength: 2000, score: { rating: 4.5, costScore: 0.7, contextScore: 0.6, featureScore: 0.5 } }),
        buildModel({ id: 'b', name: 'B', pricing: { prompt: 0.001, completion: 0.002, request: null }, contextLength: 4000, score: { rating: 4.8, costScore: 0.8, contextScore: 0.9, featureScore: 0.7 } }),
        buildModel({ id: 'c', name: 'C', pricing: { prompt: 0.003, completion: 0.001, request: null }, contextLength: 1000, score: { rating: 4.2, costScore: 0.5, contextScore: 0.4, featureScore: 0.6 } }),
    ];

    it('sorts by rating descending by default', () => {
        const sorted = sortModels(models, [{ key: 'rating', direction: 'desc' }]);
        expect(sorted.map((m) => m.id)).toEqual(['b', 'a', 'c']);
    });

    it('sorts by prompt price ascending', () => {
        const sorted = sortModels(models, [{ key: 'promptPrice', direction: 'asc' }]);
        expect(sorted.map((m) => m.id)).toEqual(['b', 'a', 'c']);
    });

    it('sorts by completion price descending (nulls last)', () => {
        const withNull = buildModel({ id: 'd', name: 'D', pricing: { prompt: 0.002, completion: null, request: null } });
        const sorted = sortModels([...models, withNull], [{ key: 'completionPrice', direction: 'desc' }]);
        const last = sorted[sorted.length - 1];
        expect(last?.id).toBe('d');
    });

    it('applies secondary sort rules when primary values are equal', () => {
        const withSameRating = [
            buildModel({ id: 'x', name: 'Alpha', pricing: { prompt: 0.004, completion: 0.002, request: null }, score: { rating: 4.5, costScore: 0.5, contextScore: 0.3, featureScore: 0.4 } }),
            buildModel({ id: 'y', name: 'Beta', pricing: { prompt: 0.003, completion: 0.002, request: null }, score: { rating: 4.5, costScore: 0.6, contextScore: 0.4, featureScore: 0.5 } }),
            buildModel({ id: 'z', name: 'Gamma', pricing: { prompt: 0.002, completion: 0.002, request: null }, score: { rating: 4.5, costScore: 0.7, contextScore: 0.5, featureScore: 0.6 } }),
        ];

        const sorted = sortModels(withSameRating, [
            { key: 'rating', direction: 'desc' },
            { key: 'promptPrice', direction: 'asc' },
        ]);

        expect(sorted.map((model) => model.id)).toEqual(['z', 'y', 'x']);
    });
});

describe('describeFilters', () => {
    it('returns "All models" for default filters', () => {
        expect(describeFilters(defaultFilters)).toBe('All models');
    });

    it('summarises active constraints', () => {
        const filters: FilterState = {
            ...cloneFilters(),
            search: 'gpt',
            providers: ['openai'],
            maxPromptPrice: 0.001,
            minContext: 1024,
            supportsTools: true,
            supportsJson: true,
        };
        const summary = describeFilters(filters);
        expect(summary).toContain('matching "gpt"');
        expect(summary).toContain('provider: openai');
        expect(summary).toContain('prompt ≤ $0.001000/1k tokens');
        expect(summary).toContain('context ≥ 1,024 tokens');
        expect(summary).toContain('tool calling');
        expect(summary).toContain('JSON/structured outputs');
    });
});
