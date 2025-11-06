import type { Model } from '../types';

const OPENROUTER_MODELS_BASE_URL = 'https://openrouter.ai/models';

const encodeSlug = (slug: string): string => slug
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

/**
 * Builds a link to the public OpenRouter model page.
 */
export const getModelPageUrl = (model: Pick<Model, 'id' | 'meta'>): string => {
    const slug = model.meta.slug ?? model.id;
    const encodedSlug = encodeSlug(slug);
    return `${OPENROUTER_MODELS_BASE_URL}/${encodedSlug}`;
};
