import React from 'react';

// 品牌色（与 main.tsx BRAND_COLOR 保持一致）
const BRAND = '#2c5282';

/**
 * 丰晟达 ERP 品牌 Logo
 * - 28×28 圆角方块 + 三道白色横线（纸箱层叠意象）
 * - dark=true 时文字为白色（深色侧边栏用）
 */
export function BrandLogo({ size = 28, withText = true, dark = false, text = '丰晟达 ERP', sub = null }: {
  size?: number;
  withText?: boolean;
  dark?: boolean;
  text?: string;
  sub?: string | null;
}) {
  const textColor = dark ? '#f1f5f9' : '#1e293b';
  const subColor = dark ? 'rgba(255,255,255,0.45)' : '#94a3b8';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-label="丰晟达 ERP Logo"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={dark ? '#3b82f6' : '#2c5282'} />
            <stop offset="100%" stopColor={dark ? '#1d4ed8' : '#1e3a5f'} />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#logoGrad)" />
        {/* 三道白色横线 = 纸箱堆叠层 */}
        <rect x="7" y="9"  width="18" height="2.4" rx="1" fill="#fff" />
        <rect x="7" y="14.8" width="18" height="2.4" rx="1" fill="#fff" opacity="0.85" />
        <rect x="7" y="20.6" width="18" height="2.4" rx="1" fill="#fff" opacity="0.7" />
      </svg>
      {withText && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{
            fontSize: size >= 28 ? 16 : 14,
            fontWeight: 600,
            color: textColor,
            letterSpacing: 0.5,
          }}>
            {text}
          </span>
          {sub && <span style={{ fontSize: 11, color: subColor, marginTop: 1 }}>{sub}</span>}
        </span>
      )}
    </span>
  );
}
