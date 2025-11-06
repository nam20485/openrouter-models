export interface RawModelArchitecture {
    modality: string | null;
    input_modalities: string[] | null;
    output_modalities: string[] | null;
    tokenizer: string | null;
    instruct_type: string | null;
}

export interface RawPricing {
    prompt?: string | null;
    completion?: string | null;
    request?: string | null;
    [key: string]: string | null | undefined;
}

export interface RawTopProvider {
    context_length?: number | null;
    max_completion_tokens?: number | null;
    is_moderated?: boolean | null;
}

export interface RawModel {
    id: string;
    name: string;
    description?: string | null;
    context_length?: number | null;
    architecture?: RawModelArchitecture | null;
    pricing?: RawPricing | null;
    top_provider?: RawTopProvider | null;
    supported_parameters?: string[] | null;
    default_parameters?: Record<string, unknown> | null;
    canonical_slug?: string | null;
    created?: number | null;
}

export interface ModelPricing {
    prompt: number | null;
    completion: number | null;
    request: number | null;
}

export interface ModelCapabilities {
    supportsTools: boolean;
    supportsJson: boolean;
    supportsVision: boolean;
    supportsAudio: boolean;
    requiresModeration: boolean;
    freeTier: boolean;
}

export interface ModelMeta {
    provider: string;
    slug: string;
    createdAt?: Date;
}

export interface ModelScore {
    rating: number;
    costScore: number;
    contextScore: number;
    featureScore: number;
}

export interface Model {
    id: string;
    name: string;
    description: string;
    contextLength: number;
    pricing: ModelPricing;
    architecture: RawModelArchitecture;
    supportedParameters: string[];
    topProvider: RawTopProvider;
    capabilities: ModelCapabilities;
    meta: ModelMeta;
    score: ModelScore;
}

export interface ModelFetchConfig {
    signal?: AbortSignal;
    includeRaw?: boolean;
}

export interface ModelDataset {
    models: Model[];
    raw?: RawModel[];
    metrics: {
        minPromptPrice: number;
        maxPromptPrice: number;
        minContext: number;
        maxContext: number;
    };
}

export interface ModelFetchResult {
    dataset: ModelDataset;
    source: 'live' | 'fallback';
    warnings: string[];
}

export interface FilterState {
    search: string;
    providers: string[];
    maxPromptPrice: number | null;
    minContext: number | null;
    maxContext: number | null;
    supportsTools: boolean;
    supportsJson: boolean;
    supportsVision: boolean;
    freeOnly: boolean;
}

export type SortKey = 'rating' | 'promptPrice' | 'completionPrice' | 'context' | 'name' | 'provider' | 'year';

export interface SortRule {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export type SortState = SortRule[];
