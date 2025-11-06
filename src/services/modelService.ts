import { ModelDataset, ModelFetchConfig, ModelFetchResult, RawModel } from '../types';
import { normalizeModels } from '../lib/modelTransforms';

const API_URL = 'https://openrouter.ai/api/v1/models';
const FALLBACK_URL = '/models-sample.json';

const DEFAULT_TIMEOUT_MS = 12_000;

let cachedResult: Promise<ModelFetchResult> | null = null;

const abortableTimeout = (timeoutMs: number): AbortSignal => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
};

const mergeSignals = (primary?: AbortSignal, secondary?: AbortSignal): AbortSignal | undefined => {
    if (!primary) {
        return secondary;
    }

    if (!secondary) {
        return primary;
    }

    const controller = new AbortController();

    const forwardAbort = (signal: AbortSignal) => {
        if (signal.aborted) {
            controller.abort(signal.reason);
        } else {
            signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
        }
    };

    forwardAbort(primary);
    forwardAbort(secondary);

    return controller.signal;
};

const resolveApiHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
        Accept: 'application/json',
    };

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
    }

    const referer = import.meta.env.VITE_APP_REFERER;
    if (referer) {
        headers['HTTP-Referer'] = referer;
    }

    const title = import.meta.env.VITE_APP_TITLE;
    if (title) {
        headers['X-Title'] = title;
    }

    return headers;
};

const extractModelsFromPayload = (payload: unknown): RawModel[] => {
    if (Array.isArray(payload)) {
        return payload as RawModel[];
    }

    if (typeof payload === 'object' && payload !== null && 'data' in payload) {
        const data = (payload as { data: unknown }).data;
        if (Array.isArray(data)) {
            return data as RawModel[];
        }
    }

    throw new Error('Unexpected models response format.');
};

const fetchFromApi = async ({ signal }: ModelFetchConfig = {}): Promise<ModelDataset> => {
    const timeoutSignal = abortableTimeout(DEFAULT_TIMEOUT_MS);
    const combinedSignal = mergeSignals(signal, timeoutSignal);

    const response = await fetch(API_URL, {
        method: 'GET',
        headers: resolveApiHeaders(),
        signal: combinedSignal,
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const rawModels = extractModelsFromPayload(payload);
    return normalizeModels(rawModels);
};

const fetchFromFallback = async ({ signal }: ModelFetchConfig = {}): Promise<ModelDataset> => {
    const response = await fetch(FALLBACK_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
    });

    if (!response.ok) {
        throw new Error(`Fallback dataset request failed with status ${response.status}`);
    }

    const rawModels = (await response.json()) as RawModel[];
    return normalizeModels(rawModels);
};

const loadModels = async (config: ModelFetchConfig = {}): Promise<ModelFetchResult> => {
    const warnings: string[] = [];

    try {
        const dataset = await fetchFromApi(config);
        return { dataset, source: 'live', warnings };
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        warnings.push(`Falling back to bundled dataset: ${reason}`);

        const dataset = await fetchFromFallback(config);
        return { dataset, source: 'fallback', warnings };
    }
};

export const fetchModelDataset = async (config: ModelFetchConfig = {}): Promise<ModelFetchResult> => {
    if (!cachedResult) {
        cachedResult = loadModels(config);
    }
    return cachedResult;
};

export const invalidateModelCache = (): void => {
    cachedResult = null;
};
