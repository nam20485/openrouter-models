import { FilterState, Model, ModelDataset, ModelPricing, ModelScore, RawModel } from '../types';

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const parsePrice = (value?: string | null): number | null => {
    if (value === undefined || value === null) {
        return null;
    }

    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
};

const coalesceDescription = (description?: string | null): string =>
    (description ?? '').trim() || 'No description provided yet.';

const extractProvider = (id: string): string => id.split('/')[0] ?? id;

const deduplicate = <T>(values: T[]): T[] => Array.from(new Set(values));

const computeMetrics = (models: RawModel[]) => {
    const promptPrices: number[] = [];
    const contextValues: number[] = [];

    for (const model of models) {
        const prompt = parsePrice(model.pricing?.prompt ?? null);
        if (prompt !== null && prompt >= 0) {
            promptPrices.push(prompt);
        }

        const context = model.context_length ?? model.top_provider?.context_length ?? null;
        if (context !== null && Number.isFinite(context)) {
            contextValues.push(context);
        }
    }

    const minPromptPrice = promptPrices.length ? Math.min(...promptPrices) : 0;
    const maxPromptPrice = promptPrices.length ? Math.max(...promptPrices) : minPromptPrice;
    const minContext = contextValues.length ? Math.min(...contextValues) : 0;
    const maxContext = contextValues.length ? Math.max(...contextValues) : minContext;

    return {
        minPromptPrice,
        maxPromptPrice,
        minContext,
        maxContext,
    };
};

const buildPricing = (model: RawModel): ModelPricing => ({
    prompt: parsePrice(model.pricing?.prompt ?? null),
    completion: parsePrice(model.pricing?.completion ?? null),
    request: parsePrice(model.pricing?.request ?? null),
});

const computeCapabilities = (model: RawModel) => {
    const supported = deduplicate(model.supported_parameters ?? []);
    const architecture = model.architecture ?? {
        modality: null,
        input_modalities: null,
        output_modalities: null,
        tokenizer: null,
        instruct_type: null,
    };
    const inputModalities = architecture.input_modalities ?? [];

    const supportsTools = supported.includes('tools') || supported.includes('tool_choice');
    const supportsJson = supported.includes('response_format') || supported.includes('structured_outputs');
    const supportsVision = inputModalities.includes('image') || (architecture.modality?.includes('image') ?? false);
    const supportsAudio = inputModalities.includes('audio') || (architecture.modality?.includes('audio') ?? false);
    const freeTier = parsePrice(model.pricing?.prompt ?? null) === 0 && parsePrice(model.pricing?.completion ?? null) === 0;
    const requiresModeration = model.top_provider?.is_moderated ?? false;

    return {
        supportsTools,
        supportsJson,
        supportsVision,
        supportsAudio,
        freeTier,
        requiresModeration,
    };
};

const computeScore = (
    model: RawModel,
    pricing: ModelPricing,
    capabilities: ReturnType<typeof computeCapabilities>,
    metrics: ModelDataset['metrics'],
): ModelScore => {
    const promptPrice = pricing.prompt;
    const contextLength = model.context_length ?? model.top_provider?.context_length ?? 0;

    const priceRange = Math.max(metrics.maxPromptPrice - metrics.minPromptPrice, Number.EPSILON);
    const contextRange = Math.max(metrics.maxContext - metrics.minContext, Number.EPSILON);

    const costScore = promptPrice === null
        ? 0.4
        : 1 - clamp((promptPrice - metrics.minPromptPrice) / priceRange, 0, 1);

    const contextScore = contextLength
        ? clamp((contextLength - metrics.minContext) / contextRange, 0, 1)
        : 0;

    const featureContributions = [
        capabilities.supportsTools,
        capabilities.supportsJson,
        capabilities.supportsVision,
        capabilities.supportsAudio,
        capabilities.freeTier,
    ];
    const featureScore = featureContributions.filter(Boolean).length / featureContributions.length;

    const weighted = costScore * 0.4 + contextScore * 0.3 + featureScore * 0.3;
    const rating = clamp(Math.round(((weighted * 4) + 1) * 10) / 10, 1, 5);

    return {
        rating,
        costScore: Number.parseFloat(costScore.toFixed(3)),
        contextScore: Number.parseFloat(contextScore.toFixed(3)),
        featureScore: Number.parseFloat(featureScore.toFixed(3)),
    };
};

export const normalizeModels = (rawModels: RawModel[]): ModelDataset => {
    const metrics = computeMetrics(rawModels);

    const models: Model[] = rawModels.map((model) => {
        const pricing = buildPricing(model);
        const capabilities = computeCapabilities(model);
        const contextLength = model.context_length ?? model.top_provider?.context_length ?? 0;

        return {
            id: model.id,
            name: model.name,
            description: coalesceDescription(model.description),
            contextLength,
            pricing,
            architecture: model.architecture ?? {
                modality: null,
                input_modalities: null,
                output_modalities: null,
                tokenizer: null,
                instruct_type: null,
            },
            supportedParameters: deduplicate(model.supported_parameters ?? []),
            topProvider: {
                context_length: model.top_provider?.context_length ?? null,
                max_completion_tokens: model.top_provider?.max_completion_tokens ?? null,
                is_moderated: model.top_provider?.is_moderated ?? null,
            },
            capabilities,
            meta: {
                provider: extractProvider(model.id),
                slug: model.canonical_slug ?? model.id,
                createdAt: model.created ? new Date(model.created * 1000) : undefined,
            },
            score: computeScore(model, pricing, capabilities, metrics),
        };
    });

    return {
        models,
        raw: rawModels,
        metrics,
    };
};

export const defaultFilters: FilterState = {
    search: '',
    providers: [],
    maxPromptPrice: null,
    minContext: null,
    maxContext: null,
    supportsTools: false,
    supportsJson: false,
    supportsVision: false,
    freeOnly: false,
};
