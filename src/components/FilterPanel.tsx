import { ChangeEvent, memo, useCallback } from 'react';

import type { FilterState, SortKey, SortRule, SortState } from '../types';
import styles from './FilterPanel.module.css';

interface FilterPanelProps {
    filters: FilterState;
    sort: SortState;
    providerOptions: string[];
    maxPromptPriceBounds: [number, number];
    contextBounds: [number, number];
    isLoading: boolean;
    onFiltersChange: (filters: FilterState) => void;
    onSortChange: (sort: SortState) => void;
    onReset: () => void;
}

const formatPriceLabel = (value: number) => (value > 0 ? `$${value.toFixed(6)}/1k tokens` : 'Enter max price');

const toggleBooleanFilter = (
    filters: FilterState,
    key: keyof Pick<FilterState, 'supportsTools' | 'supportsJson' | 'supportsVision' | 'freeOnly'>,
    onChange: FilterPanelProps['onFiltersChange'],
) => {
    onChange({
        ...filters,
        [key]: !filters[key],
    });
};

const primarySortRule = (sort: SortState): SortRule => sort[0] ?? { key: 'rating', direction: 'desc' };

const updateSort = (current: SortState, key: SortKey): SortState => {
    const nextDirection = current[0]?.key === key
        ? (current[0].direction === 'asc' ? 'desc' : 'asc')
        : (key === 'name' || key === 'provider' ? 'asc' : 'desc');
    return [{ key, direction: nextDirection }];
};

export const FilterPanel = memo(({
    filters,
    sort,
    providerOptions,
    maxPromptPriceBounds,
    contextBounds,
    isLoading,
    onFiltersChange,
    onSortChange,
    onReset,
}: FilterPanelProps) => {
    const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, search: event.target.value });
    }, [filters, onFiltersChange]);

    const handleProviderChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
        onFiltersChange({ ...filters, providers: selected });
    }, [filters, onFiltersChange]);

    const handlePromptPriceChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        onFiltersChange({
            ...filters,
            maxPromptPrice: value ? Number.parseFloat(value) : null,
        });
    }, [filters, onFiltersChange]);

    const handleMinContextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        onFiltersChange({
            ...filters,
            minContext: value ? Number.parseInt(value, 10) : null,
        });
    }, [filters, onFiltersChange]);

    const handleMaxContextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        onFiltersChange({
            ...filters,
            maxContext: value ? Number.parseInt(value, 10) : null,
        });
    }, [filters, onFiltersChange]);

    const handleSortChange = useCallback((key: SortKey) => {
        onSortChange(updateSort(sort, key));
    }, [onSortChange, sort]);

    const primarySort = primarySortRule(sort);

    return (
        <section className={styles.panel} aria-label="Filter and sorting controls">
            <div className={styles.rowPrimary}>
                <label className={styles.field}>
                    <span>Search</span>
                    <input
                        type="search"
                        value={filters.search}
                        onChange={handleSearchChange}
                        placeholder="Find models by name or capability"
                        aria-label="Search models"
                        disabled={isLoading}
                    />
                </label>

                <label className={styles.field}>
                    <span>Providers</span>
                    <select
                        multiple
                        value={filters.providers}
                        onChange={handleProviderChange}
                        aria-label="Filter by provider"
                        disabled={isLoading || providerOptions.length === 0}
                    >
                        {providerOptions.map((provider) => (
                            <option key={provider} value={provider}>
                                {provider}
                            </option>
                        ))}
                    </select>
                    <small className={styles.hint}>Hold Ctrl or Cmd to multi-select</small>
                </label>

                <label className={styles.field}>
                    <span>Max prompt price</span>
                    <input
                        type="number"
                        min={maxPromptPriceBounds[0]}
                        step={0.000001}
                        value={filters.maxPromptPrice ?? ''}
                        onChange={handlePromptPriceChange}
                        placeholder={formatPriceLabel(maxPromptPriceBounds[1])}
                        aria-label="Maximum prompt price"
                        disabled={isLoading}
                    />
                </label>

                <div className={styles.fieldGroup}>
                    <label className={styles.field}>
                        <span>Context min</span>
                        <input
                            type="number"
                            min={contextBounds[0]}
                            max={contextBounds[1]}
                            step={1024}
                            value={filters.minContext ?? ''}
                            onChange={handleMinContextChange}
                            aria-label="Minimum context tokens"
                            disabled={isLoading}
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Context max</span>
                        <input
                            type="number"
                            min={contextBounds[0]}
                            max={contextBounds[1]}
                            step={1024}
                            value={filters.maxContext ?? ''}
                            onChange={handleMaxContextChange}
                            aria-label="Maximum context tokens"
                            disabled={isLoading}
                        />
                    </label>
                </div>
            </div>

            <div className={styles.rowSecondary}>
                <fieldset className={styles.toggleRow}>
                    <legend>Capabilities</legend>
                    <button
                        type="button"
                        className={filters.supportsTools ? styles.toggleActive : styles.toggle}
                        onClick={() => toggleBooleanFilter(filters, 'supportsTools', onFiltersChange)}
                        aria-pressed={filters.supportsTools}
                        disabled={isLoading}
                    >
                        Tools
                    </button>
                    <button
                        type="button"
                        className={filters.supportsJson ? styles.toggleActive : styles.toggle}
                        onClick={() => toggleBooleanFilter(filters, 'supportsJson', onFiltersChange)}
                        aria-pressed={filters.supportsJson}
                        disabled={isLoading}
                    >
                        JSON
                    </button>
                    <button
                        type="button"
                        className={filters.supportsVision ? styles.toggleActive : styles.toggle}
                        onClick={() => toggleBooleanFilter(filters, 'supportsVision', onFiltersChange)}
                        aria-pressed={filters.supportsVision}
                        disabled={isLoading}
                    >
                        Vision
                    </button>
                    <button
                        type="button"
                        className={filters.freeOnly ? styles.toggleActive : styles.toggle}
                        onClick={() => toggleBooleanFilter(filters, 'freeOnly', onFiltersChange)}
                        aria-pressed={filters.freeOnly}
                        disabled={isLoading}
                    >
                        Free tier
                    </button>
                </fieldset>

                <fieldset className={styles.sortRow}>
                    <legend>Sort</legend>
                    <button
                        type="button"
                        className={primarySort.key === 'rating' ? styles.toggleActive : styles.toggle}
                        onClick={() => handleSortChange('rating')}
                        disabled={isLoading}
                    >
                        Rating {primarySort.key === 'rating' ? `(${primarySort.direction})` : ''}
                    </button>
                    <button
                        type="button"
                        className={primarySort.key === 'promptPrice' ? styles.toggleActive : styles.toggle}
                        onClick={() => handleSortChange('promptPrice')}
                        disabled={isLoading}
                    >
                        Prompt price {primarySort.key === 'promptPrice' ? `(${primarySort.direction})` : ''}
                    </button>
                    <button
                        type="button"
                        className={primarySort.key === 'completionPrice' ? styles.toggleActive : styles.toggle}
                        onClick={() => handleSortChange('completionPrice')}
                        disabled={isLoading}
                    >
                        Completion price {primarySort.key === 'completionPrice' ? `(${primarySort.direction})` : ''}
                    </button>
                    <button
                        type="button"
                        className={primarySort.key === 'context' ? styles.toggleActive : styles.toggle}
                        onClick={() => handleSortChange('context')}
                        disabled={isLoading}
                    >
                        Context {primarySort.key === 'context' ? `(${primarySort.direction})` : ''}
                    </button>
                    <button
                        type="button"
                        className={primarySort.key === 'name' ? styles.toggleActive : styles.toggle}
                        onClick={() => handleSortChange('name')}
                        disabled={isLoading}
                    >
                        Alphabetical {primarySort.key === 'name' ? `(${primarySort.direction})` : ''}
                    </button>
                </fieldset>

                <button type="button" className={styles.reset} onClick={onReset} disabled={isLoading}>
                    Reset filters
                </button>
            </div>
        </section>
    );
});
