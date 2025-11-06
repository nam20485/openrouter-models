import { memo } from 'react';

import type { Model } from '../types';
import styles from './ModelTable.module.css';

interface ModelTableProps {
    models: Model[];
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
    return (
        <tr>
            <th scope="row">
                <div className={styles.modelCell}>
                    <span className={styles.modelName}>{model.name}</span>
                    <span className={styles.modelSlug}>{model.meta.slug}</span>
                </div>
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

export const ModelTable = memo(({ models }: ModelTableProps) => (
    <div className={styles.wrapper}>
        <table className={styles.table}>
            <caption className={styles.visuallyHidden}>Detailed list of filtered OpenRouter models</caption>
            <thead>
                <tr>
                    <th scope="col">Model</th>
                    <th scope="col">Provider</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Prompt price</th>
                    <th scope="col">Completion price</th>
                    <th scope="col">Context</th>
                    <th scope="col">Capabilities</th>
                    <th scope="col">Year</th>
                </tr>
            </thead>
            <tbody>
                {models.map((model) => (
                    <ModelTableRow key={model.id} model={model} />
                ))}
            </tbody>
        </table>
    </div>
));
