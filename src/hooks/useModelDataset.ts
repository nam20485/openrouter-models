import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchModelDataset, invalidateModelCache } from '../services/modelService';
import { FilterState, ModelDataset, ModelFetchResult, SortState } from '../types';
import { defaultFilters } from '../lib/modelTransforms';
import { describeFilters, filterModels, getProviderOptions, sortModels } from '../lib/modelFilters';

interface UseModelDatasetOptions {
    sort?: SortState;
    filters?: FilterState;
}

interface UseModelDatasetState {
    dataset: ModelDataset | null;
    isLoading: boolean;
    error: string | null;
    source: ModelFetchResult['source'] | null;
    warnings: string[];
    appliedFilters: FilterState;
    providerOptions: string[];
    filteredModels: ReturnType<typeof filterModels>;
    refresh: () => Promise<void>;
    filterDescription: string;
}

const DEFAULT_SORT: SortState = [{ key: 'rating', direction: 'desc' }];

type InternalState = Omit<UseModelDatasetState, 'refresh' | 'filterDescription'>;

export const useModelDataset = ({ sort, filters }: UseModelDatasetOptions = {}): UseModelDatasetState => {
    const [state, setState] = useState<InternalState>({
        dataset: null,
        isLoading: true,
        error: null,
        source: null,
        warnings: [],
        appliedFilters: filters ?? defaultFilters,
        providerOptions: [],
        filteredModels: [],
    });

    const sortState = sort && sort.length ? sort : DEFAULT_SORT;
    const filterState = filters ?? state.appliedFilters;

    const refresh = useCallback(async () => {
        setState((prev: InternalState) => ({ ...prev, isLoading: true, error: null }));
        invalidateModelCache();
        const controller = new AbortController();

        try {
            const result = await fetchModelDataset({ signal: controller.signal });
            setState((prev: InternalState) => ({
                ...prev,
                dataset: result.dataset,
                isLoading: false,
                error: null,
                source: result.source,
                warnings: result.warnings,
                providerOptions: getProviderOptions(result.dataset.models),
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setState((prev: InternalState) => ({
                ...prev,
                isLoading: false,
                error: message,
                filteredModels: [],
            }));
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        const load = async () => {
            setState((prev: InternalState) => ({ ...prev, isLoading: true, error: null }));
            try {
                const result = await fetchModelDataset({ signal: controller.signal });
                if (!mounted) {
                    return;
                }
                setState((prev: InternalState) => ({
                    ...prev,
                    dataset: result.dataset,
                    isLoading: false,
                    error: null,
                    source: result.source,
                    warnings: result.warnings,
                    providerOptions: getProviderOptions(result.dataset.models),
                }));
            } catch (error) {
                if (!mounted) {
                    return;
                }
                const message = error instanceof Error ? error.message : 'Unknown error';
                setState((prev: InternalState) => ({
                    ...prev,
                    isLoading: false,
                    error: message,
                    filteredModels: [],
                }));
            }
        };

        void load();

        return () => {
            mounted = false;
            controller.abort('component-unmounted');
        };
    }, []);

    useEffect(() => {
        if (!state.dataset) {
            return;
        }

        const filtered = sortModels(filterModels(state.dataset.models, filterState), sortState);
        setState((prev: InternalState) => ({
            ...prev,
            filteredModels: filtered,
            appliedFilters: filterState,
            isLoading: false,
        }));
    }, [filterState, sortState, state.dataset]);

    const filterDescription = useMemo(
        () => describeFilters(state.appliedFilters),
        [state.appliedFilters],
    );

    return {
        ...state,
        refresh,
        filterDescription,
    };
};
