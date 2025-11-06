import { FilterState, Model, SortRule, SortState } from '../types';

const textIncludes = (haystack: string, needle: string): boolean => haystack.toLowerCase().includes(needle.toLowerCase());

const matchesSearch = (model: Model, search: string): boolean => {
    if (!search.trim()) {
        return true;
    }

    const target = search.trim().toLowerCase();
    return [model.name, model.description, model.meta.slug, model.id]
        .some((value) => value.toLowerCase().includes(target));
};

const withinPromptPrice = (model: Model, maxPrice: number | null): boolean => {
    if (maxPrice === null) {
        return true;
    }

    if (model.pricing.prompt === null) {
        return true;
    }

    return model.pricing.prompt <= maxPrice;
};

const withinContext = (model: Model, minContext: number | null, maxContext: number | null): boolean => {
    const context = model.contextLength;

    if (minContext !== null && context < minContext) {
        return false;
    }

    if (maxContext !== null && context > maxContext) {
        return false;
    }

    return true;
};

export const filterModels = (models: Model[], filters: FilterState): Model[] => models.filter((model) => {
    if (!matchesSearch(model, filters.search)) {
        return false;
    }

    if (filters.providers.length && !filters.providers.includes(model.meta.provider)) {
        return false;
    }

    if (!withinPromptPrice(model, filters.maxPromptPrice)) {
        return false;
    }

    if (!withinContext(model, filters.minContext, filters.maxContext)) {
        return false;
    }

    if (filters.supportsTools && !model.capabilities.supportsTools) {
        return false;
    }

    if (filters.supportsJson && !model.capabilities.supportsJson) {
        return false;
    }

    if (filters.supportsVision && !model.capabilities.supportsVision) {
        return false;
    }

    if (filters.freeOnly && !model.capabilities.freeTier) {
        return false;
    }

    return true;
});

const getSortValue = (model: Model, key: SortRule['key']): number | string | null => {
    switch (key) {
        case 'promptPrice':
            return model.pricing.prompt ?? null;
        case 'completionPrice':
            return model.pricing.completion ?? null;
        case 'context':
            return model.contextLength;
        case 'provider':
            return model.meta.provider.toLowerCase();
        case 'year':
            return model.meta.createdAt?.getFullYear() ?? null;
        case 'name':
            return model.name.toLowerCase();
        case 'rating':
        default:
            return model.score.rating;
    }
};

const compareNumeric = (valueA: number | null, valueB: number | null, direction: number): number => {
    if (valueA === null && valueB === null) {
        return 0;
    }

    if (valueA === null) {
        return 1;
    }

    if (valueB === null) {
        return -1;
    }

    const delta = valueA - valueB;
    if (delta === 0) {
        return 0;
    }

    return delta * direction;
};

const compareRule = (a: Model, b: Model, rule: SortRule): number => {
    const direction = rule.direction === 'asc' ? 1 : -1;
    const valueA = getSortValue(a, rule.key);
    const valueB = getSortValue(b, rule.key);

    if (typeof valueA === 'string' && typeof valueB === 'string') {
        const result = valueA.localeCompare(valueB);
        if (result !== 0) {
            return result * direction;
        }
        return 0;
    }

    const comparison = compareNumeric(
        typeof valueA === 'number' ? valueA : null,
        typeof valueB === 'number' ? valueB : null,
        direction,
    );

    if (comparison !== 0) {
        return comparison;
    }

    return 0;
};

export const sortModels = (models: Model[], sort: SortState): Model[] => {
    if (!sort.length) {
        return [...models];
    }

    const rules = sort;
    const sorted = [...models];

    sorted.sort((a, b) => {
        for (const rule of rules) {
            const result = compareRule(a, b, rule);
            if (result !== 0) {
                return result;
            }
        }

        return a.name.localeCompare(b.name);
    });

    return sorted;
};

export const getProviderOptions = (models: Model[]): string[] => {
    const providers = new Set<string>();
    models.forEach((model) => providers.add(model.meta.provider));
    return Array.from(providers).sort((a, b) => a.localeCompare(b));
};

export const describeFilters = (filters: FilterState): string => {
    const active: string[] = [];

    if (filters.search.trim()) {
        active.push(`matching "${filters.search.trim()}"`);
    }
    if (filters.providers.length) {
        active.push(`provider${filters.providers.length > 1 ? 's' : ''}: ${filters.providers.join(', ')}`);
    }
    if (filters.maxPromptPrice !== null) {
        active.push(`prompt ≤ $${filters.maxPromptPrice.toFixed(6)}/1k tokens`);
    }
    if (filters.minContext !== null || filters.maxContext !== null) {
        const parts: string[] = [];
        if (filters.minContext !== null) {
            parts.push(`≥ ${filters.minContext.toLocaleString()} tokens`);
        }
        if (filters.maxContext !== null) {
            parts.push(`≤ ${filters.maxContext.toLocaleString()} tokens`);
        }
        active.push(`context ${parts.join(' and ')}`);
    }
    if (filters.supportsTools) {
        active.push('tool calling');
    }
    if (filters.supportsJson) {
        active.push('JSON/structured outputs');
    }
    if (filters.supportsVision) {
        active.push('vision inputs');
    }
    if (filters.freeOnly) {
        active.push('free tier');
    }

    if (!active.length) {
        return 'All models';
    }

    return `Models ${active.join(', ')}`;
};
