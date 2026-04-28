import { describe, it, expect } from 'vitest';
import { parseProductCards } from './parseProductCards';

describe('parseProductCards', () => {
  it('returns empty arrays for empty input', () => {
    const result = parseProductCards('');
    expect(result).toEqual({ textParts: [], products: [] });
  });

  it('returns the input unchanged when no markers are present', () => {
    const result = parseProductCards('Hello there, no products here.');
    expect(result.textParts).toEqual(['Hello there, no products here.']);
    expect(result.products).toEqual([]);
  });

  it('parses a single pipe-format marker with all fields', () => {
    const message =
      'Try this: [PRODUCT_CARD|abc-123|Cool Bib|19.99|https://example.com/p|https://example.com/img.jpg]';
    const result = parseProductCards(message);

    expect(result.products).toEqual([
      {
        id: 'abc-123',
        name: 'Cool Bib',
        price: '19.99',
        affiliateUrl: 'https://example.com/p',
        imageUrl: 'https://example.com/img.jpg',
      },
    ]);
    expect(result.textParts).toEqual(['Try this: ', '__PRODUCT_0__']);
  });

  it('treats empty price and image as null', () => {
    const message = '[PRODUCT_CARD|id1|Name||https://example.com|]';
    const result = parseProductCards(message);

    expect(result.products[0]).toEqual({
      id: 'id1',
      name: 'Name',
      price: null,
      affiliateUrl: 'https://example.com',
      imageUrl: null,
    });
  });

  it('preserves text order around multiple products', () => {
    const message =
      'First [PRODUCT_CARD|id1|A|1.00|https://a.com|] middle [PRODUCT_CARD|id2|B|2.00|https://b.com|] last';
    const result = parseProductCards(message);

    expect(result.products.map((p) => p.id)).toEqual(['id1', 'id2']);
    expect(result.textParts).toEqual([
      'First ',
      '__PRODUCT_0__',
      ' middle ',
      '__PRODUCT_1__',
      ' last',
    ]);
  });

  it('emits sequential placeholders __PRODUCT_N__ matching products array order', () => {
    const message =
      '[PRODUCT_CARD|x|X|1|https://x|][PRODUCT_CARD|y|Y|2|https://y|][PRODUCT_CARD|z|Z|3|https://z|]';
    const result = parseProductCards(message);

    expect(result.products.map((p) => p.id)).toEqual(['x', 'y', 'z']);
    expect(result.textParts).toEqual([
      '__PRODUCT_0__',
      '__PRODUCT_1__',
      '__PRODUCT_2__',
    ]);
  });

  it('silently consumes a malformed pipe marker (fewer than 4 parts)', () => {
    const message = 'Before [PRODUCT_CARD|just|two] after';
    const result = parseProductCards(message);

    expect(result.products).toEqual([]);
    expect(result.textParts).toEqual(['Before ', ' after']);
    expect(result.textParts.join('')).not.toContain('PRODUCT_CARD');
  });

  it('silently consumes a legacy colon-format marker (no pipes)', () => {
    const message = 'Before [PRODUCT_CARD:legacy-id] after';
    const result = parseProductCards(message);

    expect(result.products).toEqual([]);
    expect(result.textParts).toEqual(['Before ', ' after']);
    expect(result.textParts.join('')).not.toContain('PRODUCT_CARD');
  });

  it('mixes a valid pipe marker with a malformed one', () => {
    const message =
      '[PRODUCT_CARD|good|Good|1.00|https://good.com|] then [PRODUCT_CARD|bad]';
    const result = parseProductCards(message);

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('good');
    expect(result.textParts).toEqual(['__PRODUCT_0__', ' then ']);
  });
});
