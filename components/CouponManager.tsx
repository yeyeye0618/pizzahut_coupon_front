'use client';

import { useState, useEffect, useRef } from 'react';
import { useCoupons } from '@/hooks/useCoupons';
import { CouponCard } from './CouponCard';
import { PAGE_SIZE } from '@/lib/coupon-utils';
import { Coupon } from '@/lib/supabase';

export default function CouponManager({ initialData }: { initialData: Coupon[] }) {
  const {
    filteredCoupons,
    allAvailableTags,
    search,
    setSearch,
    selectedTags,
    setSelectedTags,
    matchMode,
    setMatchMode,
    sortMode,
    setSortMode,
  } = useCoupons(initialData);

  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredCoupons.length) {
          setDisplayCount((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1, rootMargin: '180px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [filteredCoupons.length, displayCount]);

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) newTags.delete(tag);
    else newTags.add(tag);
    setDisplayCount(PAGE_SIZE);
    setSelectedTags(newTags);
  };

  const handleSearchChange = (value: string) => {
    setDisplayCount(PAGE_SIZE);
    setSearch(value);
  };

  const handleMatchModeChange = (mode: 'union' | 'intersection') => {
    setDisplayCount(PAGE_SIZE);
    setMatchMode(mode);
  };

  const handleSortModeChange = (mode: 'price-asc' | 'price-desc') => {
    setDisplayCount(PAGE_SIZE);
    setSortMode(mode);
  };

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <div className="brand">
            <span className="brand-dot"></span>
            PIZZA HUT COUPON
          </div>
        </div>
        <h1>Pizza Hut Coupon</h1>

        <div className="controls">
          <label className="search-box">
            <span className="search-icon"></span>
            <input
              type="text"
              placeholder="搜尋代碼或優惠內容..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </label>
          <div className="pill">總數 <span>{initialData.length}</span></div>
          <div className="pill">顯示中 <span>{Math.min(displayCount, filteredCoupons.length)}</span></div>
        </div>

        <div className="filter-bar">
          <div className="filter-head">
            <div className="tags-filter-list">
              {allAvailableTags.map(([tag]) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-tag ${selectedTags.has(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selectedTags.has(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="filter-tools">
              <div className="match-mode">
                <label className="mode-option">
                  <input
                    type="radio"
                    name="mode"
                    checked={matchMode === 'union'}
                    onChange={() => handleMatchModeChange('union')}
                  /> OR
                </label>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="mode"
                    checked={matchMode === 'intersection'}
                    onChange={() => handleMatchModeChange('intersection')}
                  /> AND
                </label>
              </div>

              <label className="sort-control">
                <span>排序</span>
                <select
                  value={sortMode}
                  onChange={(e) => handleSortModeChange(e.target.value as 'price-asc' | 'price-desc')}
                >
                  <option value="price-asc">價格低 → 高</option>
                  <option value="price-desc">價格高 → 低</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <p className="status">
          {selectedTags.size > 0 || search.trim()
            ? `找到 ${filteredCoupons.length} 筆符合條件的結果`
            : '已載入最新優惠'}
        </p>
      </section>

      <section>
        {filteredCoupons.length > 0 ? (
          <div className="grid">
            {filteredCoupons.slice(0, displayCount).map((coupon, index) => (
              <CouponCard
                key={coupon.coupon_num}
                coupon={coupon}
                keyword={search}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="empty">找不到符合條件的折價券，試試看不同關鍵字。</div>
        )}

        <div ref={observerTarget} className="infinite-trigger">
          {displayCount < filteredCoupons.length
            ? '往下滑載入更多...'
            : filteredCoupons.length > 0
              ? `已顯示全部 ${filteredCoupons.length} 筆`
              : ''}
        </div>
      </section>
    </>
  );
}
