import { extractUuidFromSlug } from './slug.util';

/**
 * Get type prefix for SKU
 */
const getTypePrefix = (type: 'frame' | 'lens' | 'sunglass'): string => {
    const prefixes = {
        frame: 'FR',
        lens: 'LE',
        sunglass: 'SG',
    };
    return prefixes[type];
};

/**
 * Generate initials from name
 * @param name - Product name
 * @returns Initials (e.g., "Mat Kinh Nike" -> "MKN")
 */
const generateInitials = (name: string): string => {
    return name
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase())
        .join('');
};

/**
 * Generate SKU base from product info
 * @param type - Product type
 * @param nameBase - Product name
 * @param slugBase - Product slug (contains UUID)
 * @returns SKU base
 */
export const generateSkuBase = (
    type: 'frame' | 'lens' | 'sunglass',
    nameBase: string,
    slugBase: string
): string => {
    const typePrefix = getTypePrefix(type);
    const initials = generateInitials(nameBase);
    const uuid = extractUuidFromSlug(slugBase);

    return `${typePrefix}-${initials}-${uuid}`;
};

/**
 * Generate variant SKU from parent SKU and options
 * @param parentSku - Parent product SKU
 * @param options - Variant options
 * @returns Variant SKU
 */
export const generateVariantSku = (
    parentSku: string,
    options: Array<{ attributeName: string; value: string }>
): string => {
    const optionCodes = options.map(option => {
        const firstLetter = option.attributeName.charAt(0).toUpperCase();
        const valueCode = generateValueCode(option.attributeName, option.value);
        return `${firstLetter}-${valueCode}`;
    });

    return `${parentSku}-${optionCodes.join('-')}`;
};

/**
 * Generate value code from attribute value
 * @param attributeName - Attribute name
 * @param value - Attribute value
 * @returns Value code
 */
const generateValueCode = (attributeName: string, value: string): string => {
    const lowerAttr = attributeName.toLowerCase();
    const lowerValue = value.toLowerCase();

    // Color mapping
    if (lowerAttr === 'color') {
        const colorMap: Record<string, string> = {
            black: 'BLK',
            white: 'WHT',
            red: 'RED',
            blue: 'BLU',
            green: 'GRN',
            yellow: 'YEL',
            gold: 'GLD',
            silver: 'SLV',
            brown: 'BRN',
            gray: 'GRY',
            grey: 'GRY',
            pink: 'PNK',
            purple: 'PRP',
            orange: 'ORG',
            tortoise: 'TRT',
        };
        return colorMap[lowerValue] || value.substring(0, 3).toUpperCase();
    }

    // Size mapping
    if (lowerAttr === 'size') {
        const sizeMap: Record<string, string> = {
            small: 'S',
            medium: 'M',
            large: 'L',
            'extra large': 'XL',
            xs: 'XS',
            xl: 'XL',
            xxl: 'XXL',
        };
        return sizeMap[lowerValue] || value.charAt(0).toUpperCase();
    }

    // Default: first 3 letters uppercase
    return value.substring(0, 3).toUpperCase();
};
