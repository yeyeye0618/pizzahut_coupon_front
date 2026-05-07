import { useMemo, useState } from 'react';
import { Database } from '@/lib/database.types';

type Coupon = Database['public']['Tables']['coupons']['Row'];

export function useCoupons(allCoupons: Coupon[]) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [matchMode, setMatchMode] = useState<"union" | "intersection">("union");
  const [sortMode, setSortMode] = useState<"price-asc" | "price-desc">("price-asc");

  const allAvailableTags = useMemo(() => {
    const counter = new Map<string, number>();
    allCoupons.forEach(c => {
      c.tags?.forEach(tag => counter.set(tag, (counter.get(tag) || 0) + 1));
    });
    return [...counter.entries()].sort((a, b) => b[1] - a[1]);
  }, [allCoupons]);

  const filteredCoupons = useMemo(() => {
    let result = allCoupons.filter(c => {
      const key = search.toLowerCase();
      const matchKey = !key || 
        c.coupon_num.toLowerCase().includes(key) || 
        (c.description?.toLowerCase().includes(key));
      
      if (!matchKey) return false;

      if (selectedTags.size === 0) return true;
      const couponTags = new Set(c.tags || []);
      const tagsArray = Array.from(selectedTags);
      
      return matchMode === "intersection" 
        ? tagsArray.every(t => couponTags.has(t))
        : tagsArray.some(t => couponTags.has(t));
    });

    return result.sort((a, b) => {
      const priceA = a.price ?? Infinity;
      const priceB = b.price ?? Infinity;
      return sortMode === "price-desc" ? priceB - priceA : priceA - priceB;
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