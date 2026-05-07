'use client';

import { useState, useEffect, useRef } from 'react';
import { useCoupons } from '@/hooks/useCoupons';
import { CouponCard } from './CouponCard';
import { PAGE_SIZE } from '@/lib/coupon-utils';

export default function CouponManager({ initialData }: { initialData: any[] }) {
  const {
    filteredCoupons,
    allAvailableTags,
    search, setSearch,
    selectedTags, setSelectedTags,
    matchMode, setMatchMode,
    sortMode, setSortMode
  } = useCoupons(initialData);

  // 分頁狀態 (無限捲動)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const observerTarget = useRef(null);

  // 當搜尋或過濾條件改變時，重置顯示數量
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [search, selectedTags, matchMode, sortMode]);

  // 無限捲動邏輯 (對應原本 event.js 的 IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredCoupons.length) {
          setDisplayCount((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1, rootMargin: '180px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [filteredCoupons.length, displayCount]);

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) newTags.delete(tag);
    else newTags.add(tag);
    setSelectedTags(newTags);
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="pill">總數 <span>{initialData.length}</span></div>
          <div className="pill">顯示 <span>{Math.min(displayCount, filteredCoupons.length)}</span></div>
        </div>

        <div className="filter-bar">
          <div className="filter-head">
            <div className="tags-filter-list">
              {allAvailableTags.map(([tag, count]) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-tag ${selectedTags.has(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
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
                    onChange={() => setMatchMode('union')} 
                  /> OR
                </label>
                <label className="mode-option">
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={matchMode === 'intersection'} 
                    onChange={() => setMatchMode('intersection')} 
                  /> AND
                </label>
              </div>

              <label className="sort-control">
                <span>排序</span>
                <select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)}>
                  <option value="price-asc">價格低 → 高</option>
                  <option value="price-desc">價格高 → 低</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        
        <p className="status">
          {selectedTags.size > 0 || search ? `找到 ${filteredCoupons.length} 筆符合條件的結果` : `已載入最新優惠`}
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
        
        {/* 無限捲動觸發點 */}
        <div ref={observerTarget} className="infinite-trigger">
          {displayCount < filteredCoupons.length ? "往下滑載入更多..." : `已顯示全部 ${filteredCoupons.length} 筆`}
        </div>
      </section>
    </>
  );
}