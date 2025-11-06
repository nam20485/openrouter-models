import { useMemo, useState } from 'react';

import { FilterPanel } from './components/FilterPanel';
import { ModelCard } from './components/ModelCard';
import { ModelTable } from './components/ModelTable';
import { useModelDataset } from './hooks/useModelDataset';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { defaultFilters } from './lib/modelTransforms';
import type { FilterState, SortState } from './types';
import styles from './App.module.css';

const DEFAULT_SORT: SortState = [{ key: 'rating', direction: 'desc' }];

const deriveBounds = (metrics?: { minPromptPrice: number; maxPromptPrice: number; minContext: number; maxContext: number; }) => ({
    prompt: [metrics?.minPromptPrice ?? 0, metrics?.maxPromptPrice ?? 0] as [number, number],
    context: [metrics?.minContext ?? 0, metrics?.maxContext ?? 0] as [number, number],
});

const formatSource = (source: 'live' | 'fallback' | null) => {
    if (source === 'live') {
        return 'Latest data from OpenRouter API';
    }
    if (source === 'fallback') {
        return 'Offline fallback dataset';
    }
    return 'Loading dataset…';
};

const summarizeCounts = (filtered: number, total?: number) => {
    if (typeof total !== 'number') {
        return `${filtered} models`;
    }
    return `${filtered} of ${total} models`;
};

const prepareFilters = (filters: FilterState, debouncedSearch: string): FilterState => ({
    ...filters,
    search: debouncedSearch,
});

const useResolvedFilters = (filters: FilterState, debouncedSearch: string) => useMemo(
    () => prepareFilters(filters, debouncedSearch),
    [filters, debouncedSearch],
);

const useFilterState = () => {
    const [filters, setFilters] = useState<FilterState>(() => ({ ...defaultFilters }));
    const [sort, setSort] = useState<SortState>(() => [...DEFAULT_SORT]);
    const debouncedSearch = useDebouncedValue(filters.search, 250);
    const resolvedFilters = useResolvedFilters(filters, debouncedSearch);

    return {
        filters,
        setFilters,
        sort,
        setSort,
        resolvedFilters,
    };
};

export const App = () => {
    const {
        filters,
        setFilters,
        sort,
        setSort,
        resolvedFilters,
    } = useFilterState();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const {
        dataset,
        filteredModels,
        isLoading,
        error,
        providerOptions,
        refresh,
        filterDescription,
        source,
        warnings,
    } = useModelDataset({ sort, filters: resolvedFilters });

    const bounds = deriveBounds(dataset?.metrics);
    const hasModels = filteredModels.length > 0;

    const handleFiltersChange = (next: FilterState) => {
        setFilters({ ...next });
    };

    const handleReset = () => {
        setFilters({ ...defaultFilters });
        setSort([...DEFAULT_SORT]);
    };

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
    };

    return (
        <div className={styles.app}>
            <div className={styles.page}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>OpenRouter Model Explorer</h1>
                        <p className={styles.subtitle}>Discover, filter, and compare large language models available through OpenRouter.</p>
                    </div>
                    <div className={styles.meta}>
                        <span className={styles.metaItem}>{formatSource(source)}</span>
                        <button type="button" onClick={() => refresh()} disabled={isLoading} className={styles.refresh}>
                            Refresh data
                        </button>
                    </div>
                </header>

                <main className={styles.content}>
                    <FilterPanel
                        filters={filters}
                        sort={sort}
                        providerOptions={providerOptions}
                        maxPromptPriceBounds={bounds.prompt}
                        contextBounds={bounds.context}
                        isLoading={isLoading}
                        onFiltersChange={handleFiltersChange}
                        onSortChange={(next: SortState) => setSort(next)}
                        onReset={handleReset}
                    />

                    {warnings.map((warning) => (
                        <div key={warning} className={styles.warning} role="status">
                            {warning}
                        </div>
                    ))}

                    {error && (
                        <div className={styles.error} role="alert">
                            {error}
                        </div>
                    )}

                    <section className={styles.results}>
                        <header className={styles.resultsHeader}>
                            <h2 className={styles.resultsTitle}>Models</h2>
                            <p className={styles.resultsSummary}>{summarizeCounts(filteredModels.length, dataset?.models.length)}</p>
                            <p className={styles.resultsDescription}>{filterDescription}</p>
                            <div className={styles.viewToggle} role="group" aria-label="Change results layout">
                                <button
                                    type="button"
                                    className={viewMode === 'grid' ? styles.viewButtonActive : styles.viewButton}
                                    onClick={() => handleViewModeChange('grid')}
                                    aria-pressed={viewMode === 'grid'}
                                    disabled={isLoading || !hasModels}
                                >
                                    Card view
                                </button>
                                <button
                                    type="button"
                                    className={viewMode === 'list' ? styles.viewButtonActive : styles.viewButton}
                                    onClick={() => handleViewModeChange('list')}
                                    aria-pressed={viewMode === 'list'}
                                    disabled={isLoading || !hasModels}
                                >
                                    Detail view
                                </button>
                            </div>
                        </header>

                        {isLoading && (
                            <div className={styles.loading} role="status" aria-live="polite">
                                Fetching models…
                            </div>
                        )}

                        {!isLoading && !hasModels && !error && (
                            <div className={styles.empty} role="status" aria-live="polite">
                                No models matched your filters. Try adjusting the constraints or clearing filters.
                            </div>
                        )}

                        {!isLoading && hasModels && (
                            viewMode === 'grid' ? (
                                <div className={styles.grid}>
                                    {filteredModels.map((model) => (
                                        <ModelCard key={model.id} model={model} />
                                    ))}
                                </div>
                            ) : (
                                    <ModelTable models={filteredModels} initialSort={sort} />
                            )
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};
