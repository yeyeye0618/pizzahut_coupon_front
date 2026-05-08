'use client';

import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { HighlightedText } from './HighlightedText';
import { normalizeTags, formatOrderLink } from '@/lib/coupon-utils';
import { Coupon } from '@/lib/supabase'; // 確保從這裡匯入強型別

interface CouponCardProps {
  coupon: Coupon; // 修正 Lint: 取代 any
  keyword: string;
  index: number;
}

export function CouponCard({ coupon, keyword, index }: CouponCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggleButton, setShowToggleButton] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  const tags = useMemo(() => normalizeTags(coupon.tags), [coupon.tags]);

  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflowing = textRef.current.scrollHeight > textRef.current.clientHeight;
        setShowToggleButton(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [coupon.description, keyword]);

  const handleOrderRedirect = () => {
    const url = formatOrderLink(coupon.coupon_num);
    // 修正資安風險：加入 noopener, noreferrer 防止 tabnabbing
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderDescription = () => {
    const desc = String(coupon.description ?? "暫無說明");
    const paragraphs = desc.split('。').filter(Boolean);

    // 1. 定義用於分割的 Global Regex
    const splitRegex = /(價格：\$[\d+~?\$]+)/g;
    // 2. 定義用於「判斷」的非 Global Regex (避開 lastIndex 副作用)
    const checkRegex = /^價格：\$[\d+~?\$]+$/;

    return paragraphs.map((p, i) => {
      const segments = p.split(splitRegex);

      return (
        <span key={i}>
          {segments.map((seg, j) => {
            // 使用沒有狀態副作用的 checkRegex.test
            if (checkRegex.test(seg)) {
              return <span key={j} className="price-highlight">{seg}</span>;
            }
            // 非價格部分則進行關鍵字高亮
            return <HighlightedText key={j} text={seg} keyword={keyword} />;
          })}
          {/* 渲染換行 */}
          {i < paragraphs.length - 1 && (
            <>
              <br />
              <br />
            </>
          )}
        </span>
      );
    });
  };

  return (
    <article 
      className="coupon-card" 
      style={{ '--i': index } as React.CSSProperties}
    >
      <div className="card-head">
        <span className="tag">優惠代碼</span>
        <h3 className="code">
          <HighlightedText text={coupon.coupon_num} keyword={keyword} />
        </h3>
      </div>

      <div className={`tags-row ${tags.length === 0 ? 'tags-row-empty' : ''}`}>
        <div className="tags-list">
          {tags.map((tag) => (
            <span key={tag} className="tags-item">
              <HighlightedText text={tag} keyword={keyword} />
            </span>
          ))}
        </div>
      </div>

      <div className="description-wrap">
        <p className="description">
          <span 
            ref={textRef}
            className={`description-text ${!isExpanded ? 'is-collapsed' : ''}`}
          >
            {renderDescription()}
          </span>
        </p>
        
        {showToggleButton && (
          <button 
            className="description-toggle" 
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
          >
            {isExpanded ? "顯示更少" : "顯示更多"}
          </button>
        )}
      </div>

      <button 
        className="copy-btn" 
        onClick={handleOrderRedirect} // 使用處理函式
        type="button"
      >
        跳轉訂餐
      </button>
    </article>
  );
}