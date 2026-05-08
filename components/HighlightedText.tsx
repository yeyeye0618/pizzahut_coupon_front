// components/HighlightedText.tsx
import { useMemo } from 'react';
import { escapeRegExp } from '@/lib/coupon-utils';

interface HighlightedTextProps {
  text: string;
  keyword: string;
}

export function HighlightedText({ text, keyword }: HighlightedTextProps) {
  const trimmedKeyword = keyword.trim();

  // 使用 useMemo 處理邏輯運算，確保只有在 text 或 keyword 改變時才重新計算
  const parts = useMemo(() => {
    if (!trimmedKeyword) return null;

    // 1. 安全轉義：將使用者輸入轉為純文字正則，消除 SyntaxError 風險
    const escaped = escapeRegExp(trimmedKeyword);
    
    // 2. 建立正則：因為經過轉義，這裡 new RegExp 是安全的
    const regex = new RegExp(`(${escaped})`, 'gi');
    
    // 3. 分割字串
    return text.split(regex);
  }, [text, trimmedKeyword]);

  // --- 渲染部分 (純粹的 JSX) ---

  // 情況 A: 沒有關鍵字，直接回傳原文字
  if (!parts) {
    return <>{text}</>;
  }

  // 情況 B: 渲染高亮後的陣列
  return (
    <>
      {parts.map((part, i) => (
        // 使用不具備副作用的比較方式
        part.toLowerCase() === trimmedKeyword.toLowerCase() ? (
          <mark key={i} className="keyword-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      ))}
    </>
  );
}