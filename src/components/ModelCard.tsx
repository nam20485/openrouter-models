import { memo } from 'react';

import type { Model } from '../types';
import { getModelPageUrl } from '../lib/modelUrls';
import styles from './ModelCard.module.css';

interface ModelCardProps {
    model: Model;
}

const formatCurrency = (value: number | null): string => {
    if (value === null) {
        return '—';
    }
    if (value === 0) {
        return 'Free';
    }
    return `$${value.toFixed(6)}/1k`; // prices are per 1k tokens
};

const featureTags = (model: Model): string[] => {
    const tags: string[] = [];
    if (model.capabilities.supportsTools) {
        tags.push('Tool calling');
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
    return tags;
};

const renderSupportBadges = (model: Model) => featureTags(model).map((tag) => (
    <span key={tag} className={styles.tag}>
        {tag}
    </span>
));

export const ModelCard = memo(({ model }: ModelCardProps) => {
    const modelUrl = getModelPageUrl(model);

    return (
        <article className={styles.card}>
            <header className={styles.header}>
                <a
                    href={modelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.titleLink}
                >
                    <h3 className={styles.title}>{model.name}</h3>
                    <p className={styles.subtitle}>{model.meta.slug}</p>
                </a>
                <div className={styles.rating}>
                    <span className={styles.ratingValue}>{model.score.rating.toFixed(1)}</span>
                    <span className={styles.ratingLabel}>Derived rating</span>
                </div>
            </header>

            <p className={styles.description}>{model.description}</p>

            <dl className={styles.metrics}>
                <div>
                    <dt>Prompt price</dt>
                    <dd>{formatCurrency(model.pricing.prompt)}</dd>
                </div>
                <div>
                    <dt>Completion price</dt>
                    <dd>{formatCurrency(model.pricing.completion)}</dd>
                </div>
                <div>
                    <dt>Context length</dt>
                    <dd>{model.contextLength.toLocaleString()} tokens</dd>
                </div>
            </dl>

            <footer className={styles.footer}>
                <div className={styles.tags}>
                    {renderSupportBadges(model)}
                </div>
                <div className={styles.details}>
                    <span>Provider: {model.meta.provider}</span>
                    {model.topProvider.is_moderated !== null && (
                        <span>
                            Moderation: {model.topProvider.is_moderated ? 'Provider enforced' : 'Not enforced'}
                        </span>
                    )}
                </div>
            </footer>
        </article>
    );
});
