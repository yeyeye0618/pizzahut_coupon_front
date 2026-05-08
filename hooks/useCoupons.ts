// hooks/useCoupons.ts
import { useMemo, useState } from 'react';
import { Coupon } from '@/lib/supabase'; // 建議從 supabase.ts 匯入定義好的型別
import { normalizeTags } from '@/lib/coupon-utils';

export function useCoupons(allCoupons: Coupon[]) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [matchMode, setMatchMode] = useState<"union" | "intersection">("union");
  const [sortMode, setSortMode] = useState<"price-asc" | "price-desc">("price-asc");

  // 1. 計算所有可用的標籤 (確保使用與過濾相同的正規化邏輯)
  const allAvailableTags = useMemo(() => {
    const counter = new Map<string, number>();
    allCoupons.forEach(c => {
      // 使用 lib/coupon-utils 裡的 normalizeTags，確保標籤格式統一
      normalizeTags(c.tags).forEach(tag => {
        counter.set(tag, (counter.get(tag) || 0) + 1);
      });
    });
    // 依據數量排序，數量多者在前
    return [...counter.entries()].sort((a, b) => b[1] - a[1]);
  }, [allCoupons]);

  // 2. 核心過濾與排序邏輯
  const filteredCoupons = useMemo(() => {
    // 修正 lint: 使用 const 取代 let
    const result = allCoupons.filter(c => {
      const key = search.toLowerCase().trim();
      const normalizedCouponTags = normalizeTags(c.tags);
      
      // A. 搜尋關鍵字邏輯 (同步原本 main.js: 包含編號、說明、以及標籤文字)
      const matchKey = !key || 
        c.coupon_num.toLowerCase().includes(key) || 
        (c.description?.toLowerCase().includes(key)) ||
        normalizedCouponTags.some(tag => tag.toLowerCase().includes(key));
      
      if (!matchKey) return false;

      // B. 標籤篩選邏輯
      if (selectedTags.size === 0) return true;
      const tagsArray = Array.from(selectedTags);
      const couponTagSet = new Set(normalizedCouponTags);
      
      return matchMode === "intersection" 
        ? tagsArray.every(t => couponTagSet.has(t))
        : tagsArray.some(t => couponTagSet.has(t));
    });

    // C. 排序邏輯 (修正 lint 並處理價格為 null 的情況)
    return [...result].sort((a, b) => {
      // 將 null 價格視為無限大，使其排在最後面
      const priceA = a.price ?? Infinity;
      const priceB = b.price ?? Infinity;
      
      if (priceA !== priceB) {
        return sortMode === "price-desc" ? priceB - priceA : priceA - priceB;
      }
      // 價格相同時，依據編號排序 (穩定排序)
      return a.coupon_num.localeCompare(b.coupon_num, "zh-Hant");
    });
  }, [allCoupons, search, selectedTags, matchMode, sortMode]);

  return {
    filteredCoupons,
    allAvailableTags,
    search, setSearch,
    selectedTags, setSelectedTags,
    matchMode, setMatchMode,
    sortMode, setSortMode
  };
}