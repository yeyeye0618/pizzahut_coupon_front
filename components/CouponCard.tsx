'use client';
import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { HighlightedText } from './HighlightedText';
import { normalizeTags, formatOrderLink } from '@/lib/coupon-utils';

interface CouponCardProps {
  coupon: any;
  keyword: string;
  index: number;
}

export function CouponCard({ coupon, keyword, index }: CouponCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggleButton, setShowToggleButton] = useState(false); // 控制按鈕是否顯示
  const textRef = useRef<HTMLSpanElement>(null); // 用於測量高度
  
  const tags = useMemo(() => normalizeTags(coupon.tags), [coupon.tags]);

  // 測量高度的邏輯
  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        // scrollHeight 是內容完整高度，clientHeight 是被 CSS 限制後的顯示高度
        // 如果內容高度 > 顯示高度，代表被截斷了
        const isOverflowing = textRef.current.scrollHeight > textRef.current.clientHeight;
        setShowToggleButton(isOverflowing);
      }
    };

    // 初始測量
    checkOverflow();

    // 如果視窗大小改變（響應式佈局），也要重新測量
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [coupon.description, keyword]); // 當內容或搜尋關鍵字改變時重新測量

  const renderDescription = () => {
    const desc = String(coupon.description ?? "暫無說明");
    const paragraphs = desc.split('。').filter(Boolean);

    return paragraphs.map((p, i) => {
      const priceRegex = /(價格：\$[\d+~?\$]+)/g;
      const segments = p.split(priceRegex);

      return (
        <span key={i}>
          {segments.map((seg, j) => 
            priceRegex.test(seg) 
              ? <span key={j} className="price-highlight">{seg}</span>
              : <HighlightedText key={j} text={seg} keyword={keyword} />
          )}
          {i < paragraphs.length - 1 && <><br /><br /></>}
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
          {/* 這裡加入 ref */}
          <span 
            ref={textRef}
            className={`description-text ${!isExpanded ? 'is-collapsed' : ''}`}
          >
            {renderDescription()}
          </span>
        </p>
        
        {/* 只有當需要 Toggle 時才渲染按鈕 */}
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
        onClick={() => window.open(formatOrderLink(coupon.coupon_num), '_blank')}
        type="button"
      >
        跳轉訂餐
      </button>
    </article>
  );
}