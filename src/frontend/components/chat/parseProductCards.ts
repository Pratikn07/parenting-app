export interface ProductCardData {
    id: string;
    name: string;
    price: string | null;
    affiliateUrl: string;
    imageUrl: string | null;
}

/**
 * Parse product card markers from chat message
 * Format: [PRODUCT_CARD|id|name|price|url|image]
 * Handles both pipe (new) and colon (legacy) delimiters to prevent visual glitches
 */
export function parseProductCards(message: string): {
    textParts: string[];
    products: ProductCardData[];
} {
    const productRegex = /\[PRODUCT_CARD[:|](.+?)\]/g;
    const products: ProductCardData[] = [];
    const textParts: string[] = [];

    let lastIndex = 0;
    let match;

    while ((match = productRegex.exec(message)) !== null) {
        if (match.index > lastIndex) {
            textParts.push(message.slice(lastIndex, match.index));
        }

        const rawContent = match[1];
        let isValid = false;

        if (rawContent.includes('|')) {
            const parts = rawContent.split('|');
            // Expected: id|name|price|url|image
            if (parts.length >= 4) {
                products.push({
                    id: parts[0],
                    name: parts[1],
                    price: parts[2] || null,
                    affiliateUrl: parts[3],
                    imageUrl: parts[4] || null,
                });
                isValid = true;
            }
        }
        // Legacy colon format is consumed but ignored to prevent raw text display
        // (URLs with colons often break strict parsing in this format anyway)

        if (isValid) {
            textParts.push(`__PRODUCT_${products.length - 1}__`);
        }
        // If invalid, the tag is consumed from textParts (effectively hidden)

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.length) {
        textParts.push(message.slice(lastIndex));
    }

    return { textParts, products };
}
