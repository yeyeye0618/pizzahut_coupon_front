export const PAGE_SIZE = 12;

export function normalizeTags(rawTags: string | string[] | null | undefined): string[]{
  const source = Array.isArray(rawTags) ? rawTags : String(rawTags ?? "").split(/[、,，|]/);
  return source
    .map((tag) => String(tag ?? "").trim())
    .filter(Boolean);
}

export function formatOrderLink(code: string) {
  return `https://www.pizzahut.com.tw/order/?mode=step_2&type_id=1025&cno=${code}`;
}

// 解析價格邏輯 (從原本 main.js 移過來)
export function parsePrice(price: string | number | null | undefined): number | null{
  if (typeof price === "number") return price;
  const text = String(price ?? "").trim();
  const matched = text.match(/\d+/);
  return matched ? Number(matched[0]) : null;
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}