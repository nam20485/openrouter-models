import { MouseEvent, memo, useEffect, useMemo, useState } from 'react';

import type { Model, SortKey, SortRule, SortState } from '../types';
import { sortModels } from '../lib/modelFilters';
import { getModelPageUrl } from '../lib/modelUrls';
import styles from './ModelTable.module.css';

interface ModelTableProps {
    models: Model[];
    initialSort?: SortState;
}

const formatCurrency = (value: number | null): string => {
    if (value === null) {
        return '—';
    }
    if (value === 0) {
        return 'Free';
    }
    return `$${value.toFixed(6)}/1k`;
};

const formatContext = (tokens: number): string => `${tokens.toLocaleString()} tokens`;

const formatDate = (date?: Date) => (date ? date.getFullYear() : '—');

const formatCapabilities = (model: Model): string => {
    const tags: string[] = [];
    if (model.capabilities.supportsTools) {
        tags.push('Tools');
    }
    if (model.capabilities.supportsJson) {
        tags.push('JSON');
    }
    if (model.capabilities.supportsVision) {
        tags.push('Vision');
    }
    if (model.capabilities.supportsAudio) {
        tags.push('Audio');
    }
    if (model.capabilities.freeTier) {
        tags.push('Free tier');
    }
    return tags.join(', ') || '—';
};

const ModelTableRow = memo(({ model }: { model: Model }) => {
    const capabilities = formatCapabilities(model);
    const modelUrl = getModelPageUrl(model);
    return (
        <tr>
            <th scope="row">
                <a
                    href={modelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.modelLink}
                >
                    <span className={styles.modelName}>{model.name}</span>
                    <span className={styles.modelSlug}>{model.meta.slug}</span>
                </a>
            </th>
            <td>{model.meta.provider}</td>
            <td className={styles.numeric}>{model.score.rating.toFixed(1)}</td>
            <td className={styles.numeric}>{formatCurrency(model.pricing.prompt)}</td>
            <td className={styles.numeric}>{formatCurrency(model.pricing.completion)}</td>
            <td className={styles.numeric}>{formatContext(model.contextLength)}</td>
            <td>{capabilities}</td>
            <td className={styles.numeric}>{formatDate(model.meta.createdAt)}</td>
        </tr>
    );
});

type ColumnId =
    | 'name'
    | 'provider'
    | 'rating'
    | 'promptPrice'
    | 'completionPrice'
    | 'context'
    | 'capabilities'
    | 'year';

interface ColumnDefinition {
    id: ColumnId;
    label: string;
    align?: 'left' | 'right';
    sortable: boolean;
    sortKey?: SortKey;
}

const columns: ColumnDefinition[] = [
    { id: 'name', label: 'Model', sortable: true, sortKey: 'name' },
    { id: 'provider', label: 'Provider', sortable: true, sortKey: 'provider' },
    { id: 'rating', label: 'Rating', sortable: true, sortKey: 'rating', align: 'right' },
    { id: 'promptPrice', label: 'Prompt price', sortable: true, sortKey: 'promptPrice', align: 'right' },
    { id: 'completionPrice', label: 'Completion price', sortable: true, sortKey: 'completionPrice', align: 'right' },
    { id: 'context', label: 'Context', sortable: true, sortKey: 'context', align: 'right' },
    { id: 'capabilities', label: 'Capabilities', sortable: false },
    { id: 'year', label: 'Year', sortable: true, sortKey: 'year', align: 'right' },
];

const defaultDirectionForKey = (key: SortKey): SortRule['direction'] =>
    key === 'name' || key === 'provider' || key === 'year' ? 'asc' : 'desc';

const cycleDirection = (
    current: SortRule['direction'] | undefined,
    key: SortKey,
): SortRule['direction'] | null => {
    const defaultDirection = defaultDirectionForKey(key);
    if (!current) {
        return defaultDirection;
    }
    if (current === defaultDirection) {
        return defaultDirection === 'asc' ? 'desc' : 'asc';
    }
    return null;
};

const deriveAriaSort = (primaryRule: SortRule | undefined, key: SortKey | undefined): 'none' | 'ascending' | 'descending' => {
    if (!primaryRule || !key || primaryRule.key !== key) {
        return 'none';
    }
    return primaryRule.direction === 'asc' ? 'ascending' : 'descending';
};

const describeSortRule = (rule: SortRule, index: number): string => {
    const label = columns.find((column) => column.sortKey === rule.key)?.label ?? rule.key;
    return `${index + 1}. ${label} (${rule.direction === 'asc' ? 'ascending' : 'descending'})`;
};

const summarizeSortState = (sort: SortState): string => {
    if (!sort.length) {
        return 'Using default order';
    }
    return sort.map(describeSortRule).join(', ');
};

export const ModelTable = memo(({ models, initialSort = [] }: ModelTableProps) => {
    const [localSort, setLocalSort] = useState<SortState>(() => [...initialSort]);

    useEffect(() => {
        setLocalSort([...initialSort]);
    }, [initialSort]);

    const effectiveSort = localSort.length ? localSort : initialSort;

    const sortedModels = useMemo(() => sortModels(models, effectiveSort), [models, effectiveSort]);

    const primaryRule = effectiveSort[0];

    const handleSortToggle = (event: MouseEvent<HTMLButtonElement>, column: ColumnDefinition) => {
        if (!column.sortKey) {
            return;
        }
        const sortKey = column.sortKey;
        const isAdditive = event.shiftKey;
        setLocalSort((previous) => {
            const next = [...previous];
            const existingIndex = next.findIndex((rule) => rule.key === sortKey);
            const existingRule = existingIndex !== -1 ? next[existingIndex] : undefined;
            const direction = cycleDirection(existingRule?.direction, sortKey);

            if (!isAdditive) {
                if (direction === null) {
                    return [];
                }
                return [{ key: sortKey, direction }];
            }

            if (direction === null) {
                if (existingIndex === -1) {
                    return next;
                }
                next.splice(existingIndex, 1);
                return next;
            }

            if (existingIndex === -1) {
                next.push({ key: sortKey, direction });
                return next;
            }

            next[existingIndex] = { key: sortKey, direction };
            return next;
        });
    };

    return (
    <div className={styles.wrapper}>
            <table className={styles.table} aria-describedby="table-sort-description">
                <caption className={styles.visuallyHidden}>Detailed list of filtered OpenRouter models</caption>
                <thead>
                    <tr>
                        {columns.map((column) => {
                            const sortRule = effectiveSort.find((rule) => rule.key === column.sortKey);
                            const position = sortRule ? effectiveSort.indexOf(sortRule) : -1;
                            const ariaSort = deriveAriaSort(primaryRule, column.sortKey);
                            return (
                                <th
                                    key={column.id}
                                    scope="col"
                                    className={column.align === 'right' ? styles.headerNumeric : undefined}
                                    aria-sort={ariaSort}
                                >
                                    {column.sortable && column.sortKey ? (
                                        <button
                                            type="button"
                                            className={sortRule ? styles.headerButtonActive : styles.headerButton}
                                            onClick={(event) => handleSortToggle(event, column)}
                                            aria-pressed={Boolean(sortRule)}
                                        >
                                            <span>{column.label}</span>
                                            {sortRule && (
                                                <span className={styles.sortBadge} aria-hidden="true">
                                                    {sortRule.direction === 'asc' ? '▲' : '▼'}
                                                    {position >= 0 && effectiveSort.length > 1 ? (
                                                        <span className={styles.sortIndex}>{position + 1}</span>
                                                    ) : null}
                                                </span>
                                            )}
                                        </button>
                                    ) : (
                                        column.label
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedModels.map((model) => (
                        <ModelTableRow key={model.id} model={model} />
                    ))}
                </tbody>
            </table>
            <p id="table-sort-description" className={styles.assistiveDescription}>
                {summarizeSortState(effectiveSort)}. Click a header to sort. Hold Shift and click to add or adjust secondary sorts.
            </p>
    </div>
    );
});
