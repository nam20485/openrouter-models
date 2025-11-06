import { describe, expect, it } from 'vitest';

import { normalizeModels } from './modelTransforms';
import type { Model, RawModel } from '../types';

describe('normalizeModels', () => {
    const buildRawModels = (): RawModel[] => ([
        {
            id: 'alpha/vision-pro',
            name: 'Vision Pro',
            description: 'Flagship multimodal model',
            context_length: 16384,
            architecture: {
                modality: 'multimodal',
                input_modalities: ['text', 'image'],
                output_modalities: ['text'],
                tokenizer: 'vision-tokenizer',
                instruct_type: 'vision',
            },
            pricing: {
                prompt: '0.0005',
                completion: '0.0007',
                request: '0.002',
            },
            top_provider: {
                context_length: 16384,
                max_completion_tokens: 8192,
                is_moderated: true,
            },
            supported_parameters: ['tools', 'tools', 'response_format'],
            default_parameters: null,
            canonical_slug: 'alpha/vision-pro',
            created: 1700000000,
        },
        {
            id: 'beta/plain-text',
            name: 'Plain Text',
            description: null,
            context_length: null,
            architecture: {
                modality: 'text',
                input_modalities: ['text'],
                output_modalities: ['text'],
                tokenizer: 'text-tokenizer',
                instruct_type: 'chat',
            },
            pricing: {
                prompt: null,
                completion: '0.0012',
                request: '-1',
            },
            top_provider: {
                context_length: 2048,
                max_completion_tokens: 1024,
                is_moderated: false,
            },
            supported_parameters: ['tool_choice'],
            default_parameters: null,
            canonical_slug: null,
            created: null,
        },
        {
            id: 'gamma/audio-free',
            name: 'Audio Free',
            description: 'Handles audio prompts',
            context_length: 4096,
            architecture: {
                modality: 'audio',
                input_modalities: ['audio'],
                output_modalities: ['text'],
                tokenizer: 'audio-tokenizer',
                instruct_type: null,
            },
            pricing: {
                prompt: '0',
                completion: '0',
                request: null,
            },
            top_provider: {
                context_length: 4096,
                max_completion_tokens: 2048,
                is_moderated: null,
            },
            supported_parameters: ['structured_outputs'],
            default_parameters: null,
            canonical_slug: 'gamma/audio',
            created: 1705000000,
        },
    ]);

    it('produces derived dataset metrics and enriched model fields', () => {
        const rawModels = buildRawModels();
        const result = normalizeModels(rawModels);

        expect(result.metrics).toEqual({
            minPromptPrice: 0,
            maxPromptPrice: 0.0005,
            minContext: 2048,
            maxContext: 16384,
        });

        const [visionPro, plainText, audioFree] = result.models as [Model, Model, Model];

        expect(visionPro.supportedParameters).toEqual(['tools', 'response_format']);
        expect(visionPro.capabilities).toMatchObject({
            supportsTools: true,
            supportsJson: true,
            supportsVision: true,
            supportsAudio: false,
            freeTier: false,
            requiresModeration: true,
        });
        expect(visionPro.meta.provider).toBe('alpha');
        expect(visionPro.meta.slug).toBe('alpha/vision-pro');
        expect(visionPro.meta.createdAt).toBeInstanceOf(Date);
        expect(visionPro.meta.createdAt?.getTime()).toBe(1700000000 * 1000);
        expect(visionPro.score.rating).toBeCloseTo(2.9, 1);

        expect(plainText.description).toBe('No description provided yet.');
        expect(plainText.capabilities).toMatchObject({
            supportsTools: true,
            supportsJson: false,
            supportsVision: false,
            freeTier: false,
        });
        expect(plainText.meta.slug).toBe('beta/plain-text');
        expect(plainText.pricing.request).toBeNull();
        expect(plainText.score.rating).toBeCloseTo(1.9, 1);

        expect(audioFree.capabilities).toMatchObject({
            supportsAudio: true,
            supportsJson: true,
            supportsVision: false,
            freeTier: true,
        });
        expect(audioFree.pricing.prompt).toBe(0);
        expect(audioFree.pricing.completion).toBe(0);
        expect(audioFree.capabilities.requiresModeration).toBe(false);
        expect(audioFree.score.rating).toBeCloseTo(3.5, 1);

        expect(result.models.map((model) => model.contextLength)).toEqual([16384, 2048, 4096]);
    });
});
