/**
 * Convert string to slug format
 * @param text - Input text
 * @returns Slugified text
 */
export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-') // Replace multiple - with single -
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
};

/**
 * Generate short UUID (8 characters)
 * @returns Short UUID string
 */
export const generateShortUuid = (): string => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Generate unique slug with UUID
 * @param baseSlug - Base slug from nameBase
 * @returns Unique slug with UUID
 */
export const generateUniqueSlug = (baseSlug: string): string => {
    const uuid = generateShortUuid();
    return `${baseSlug}-${uuid}`;
};

/**
 * Extract UUID from slug
 * @param slug - Slug with UUID suffix
 * @returns UUID or empty string
 */
export const extractUuidFromSlug = (slug: string): string => {
    const match = slug.match(/-([A-Z0-9]{8})$/);
    return match ? match[1] : '';
};
