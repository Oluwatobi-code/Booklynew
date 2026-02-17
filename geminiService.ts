
import { Product } from './types';

/**
 * Smart AI text extraction — matches text against inventory products.
 *
 * Parses natural language like:
 *   "I want to buy 3 hair and 1 cream"
 *   "2x ankara fabric"
 *   "send me hair please"
 *
 * Returns matched items with quantities & prices from inventory,
 * plus any extracted customer name.
 */
export const extractOrderFromText = async (
  text: string,
  products: Product[]
): Promise<{
  customerName: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  source: string;
}> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const lower = text.toLowerCase().trim();
  const matchedItems: { id: string; name: string; quantity: number; price: number }[] = [];

  // --- Source detection ---
  let source = 'Other';
  if (/whatsapp/i.test(text)) source = 'WhatsApp';
  else if (/instagram|ig|insta/i.test(text)) source = 'Instagram';
  else if (/facebook|fb/i.test(text)) source = 'Facebook';
  else if (/tiktok|tik tok/i.test(text)) source = 'TikTok';
  else if (/walk[- ]?in/i.test(text)) source = 'Walk-in';
  else if (/phone|call/i.test(text)) source = 'Phone Call';

  // --- Customer name extraction ---
  // Look for patterns like "Customer: John", "from John", "for John Doe", "name: Jane"
  let customerName = 'Walk-in Customer';
  const namePatterns = [
    /(?:customer|name|from|for|buyer)\s*[:=]?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
    /(?:^|\n)\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:wants?|ordered|needs?|bought|is buying)/i
  ];
  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const name = m[1].trim();
      // Skip common false positives
      const skipWords = ['i', 'the', 'a', 'please', 'send', 'want', 'need', 'buy', 'order', 'get', 'give'];
      if (!skipWords.includes(name.toLowerCase())) {
        customerName = name;
        break;
      }
    }
  }

  // --- Product matching ---
  // Sort products by name length descending so longer names match first (e.g. "hair cream" before "hair")
  const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);

  // Track which parts of the text have been consumed to avoid double-matching
  let remaining = lower;

  for (const product of sortedProducts) {
    const productLower = product.name.toLowerCase();
    // Build search variants: full name, and individual words for partial matching
    const searchTerms = [productLower];

    // Also match significant single words from the product name (3+ chars)
    const words = productLower.split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 1) {
      searchTerms.push(...words);
    } else if (words.length === 1) {
      searchTerms.push(words[0]);
    }

    for (const term of searchTerms) {
      const idx = remaining.indexOf(term);
      if (idx === -1) continue;

      // Extract quantity — look for number before or after the product mention
      let quantity = 1;

      // Check for "Nx product" or "N product" or "N x product" patterns before the match
      const beforeText = remaining.substring(Math.max(0, idx - 20), idx);
      const afterText = remaining.substring(idx + term.length, idx + term.length + 20);

      const qtyBefore = beforeText.match(/(\d+)\s*[x×]?\s*$/i);
      const qtyAfter = afterText.match(/^\s*[x×]?\s*(\d+)/i);

      // Also check broader context: "I want to buy 3 ..."
      const broadBefore = remaining.substring(Math.max(0, idx - 40), idx);
      const qtyBroad = broadBefore.match(/(?:buy|get|send|order|want|need)\s+(\d+)\s/i);

      if (qtyBefore) {
        quantity = parseInt(qtyBefore[1]);
      } else if (qtyAfter) {
        quantity = parseInt(qtyAfter[1]);
      } else if (qtyBroad) {
        quantity = parseInt(qtyBroad[1]);
      }

      // Sanity check quantity
      if (quantity <= 0 || quantity > 9999) quantity = 1;

      // Check if this product was already matched (avoid duplicates)
      if (!matchedItems.some(m => m.id === product.id)) {
        matchedItems.push({
          id: product.id,
          name: product.name,
          quantity,
          price: product.sellingPrice
        });
      }

      // Remove matched portion to avoid re-matching
      remaining = remaining.substring(0, idx) + ' '.repeat(term.length) + remaining.substring(idx + term.length);
      break; // Move to next product
    }
  }

  const totalAmount = matchedItems.reduce((s, i) => s + (i.price * i.quantity), 0);

  return {
    customerName,
    items: matchedItems,
    totalAmount,
    source
  };
};

export const extractOrderFromImage = async (base64Data: string): Promise<any> => {
  console.log("Mock AI extracting from image");
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    customerName: "Image Extracted User",
    items: [
      { name: 'Snapshot Item', quantity: 2, price: 8500, id: Date.now().toString() }
    ],
    totalAmount: 17000,
    deliveryFee: 2000,
    source: "Instagram"
  };
};

export const verifyPaymentProof = async (base64Data: string): Promise<any> => {
  console.log("Mock AI verifying payment");
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    amount: 15000,
    date: new Date().toISOString(),
    sender: "Verified Sender"
  };
};
