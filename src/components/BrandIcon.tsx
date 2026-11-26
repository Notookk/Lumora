import type { ReactNode } from 'react';
import type { BrandIconName } from '../types/lumora';

interface BrandIconProps {
  name: BrandIconName;
  size?: number;
  className?: string;
  title?: string;
}

const icons: Record<BrandIconName, ReactNode> = {
  youtube: (
    <>
      <rect x="2.75" y="5" width="18.5" height="14" rx="4" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </>
  ),
  github: (
    <>
      <circle cx="6" cy="5" r="2.25" />
      <circle cx="6" cy="19" r="2.25" />
      <circle cx="18" cy="7" r="2.25" />
      <path d="M6 7.25v9.5M8 5h3a4.75 4.75 0 0 1 4.75 2" />
    </>
  ),
  chatgpt: (
    <>
      <path d="m12 2.75 7.25 4.25v8L12 19.25l-7.25-4.25V7l7.25-4.25Z" />
      <path d="m8.5 15 3.5-7 3.5 7M9.75 12.75h4.5" />
    </>
  ),
  claude: (
    <>
      <path d="M17.5 5.5a8.5 8.5 0 1 0 2 10.5" />
      <path d="M17 2v3M21.5 5.5h-3M21 10h3M18 17l2 2" />
    </>
  ),
  gemini: (
    <path
      d="M12 2c.55 5.65 4.35 9.45 10 10-5.65.55-9.45 4.35-10 10-.55-5.65-4.35-9.45-10-10 5.65-.55 9.45-4.35 10-10Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  gmail: (
    <>
      <rect x="3.25" y="5" width="17.5" height="14" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7M12 12.5V19" />
    </>
  ),
  x: <path d="m4 4 16 16M20 4 4 20" />,
  reddit: (
    <>
      <circle cx="12" cy="7" r="1.6" />
      <path d="M12 8.5V11M4.5 10.5 3 14M19.5 10.5 21 14" />
      <rect x="3" y="11.5" width="18" height="9" rx="4.5" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <path d="M8.5 18c1.9 1.2 5.1 1.2 7 0" />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M7.2 9.4c3.2-1 6.8-.7 9.8.9M7.8 12.8c2.7-.8 5.8-.5 8.3.8M8.5 16c2.2-.5 4.7-.3 6.6.7" />
    </>
  ),
  netflix: (
    <path d="M6 3h3.5L16 18h-3.5L6 3Zm7 0H19v18h-6V3Z" fill="currentColor" stroke="none" />
  ),
  notion: (
    <>
      <path d="M5 3.5h10l4 4v13H5v-17ZM15 3.5v4h4" />
      <path d="M8 16.5v-9l8 9v-9M8 7.5h3M13 16.5h3" />
    </>
  ),
  figma: (
    <>
      <circle cx="7.25" cy="7.25" r="3.75" />
      <circle cx="14.75" cy="7.25" r="3.75" />
      <circle cx="7.25" cy="14.75" r="3.75" />
      <circle cx="14.75" cy="14.75" r="3.75" />
      <rect x="10.75" y="18.5" width="7.5" height="3" rx="1.5" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="2.75" />
      <path d="M7.25 10.25v6.5M7.25 7.5v.1M11.25 16.75v-6.5M11.25 13.1a2.6 2.6 0 0 1 5.2 0v3.65" />
    </>
  ),
  twitch: (
    <>
      <path d="M5.25 3.25h13.5v11.5l-3.5 3.5h-3.25v3l-3-3H5.25v-15Z" />
      <path d="M10.25 7.5v5M15 7.5v5" />
    </>
  ),
  discord: (
    <>
      <path d="M7 5.5c1.7-1 3.3-1.5 5-1.5s3.3.5 5 1.5c1.5 1.2 2.5 2.9 2.8 5 .5 3.2-.4 5.8-1.8 7.7l-1.7-2.2c-1.2.4-2.7.7-4.3.7s-3.1-.3-4.3-.7l-1.7 2.2c-1.4-1.9-2.3-4.5-1.8-7.7.3-2.1 1.3-3.8 2.8-5Z" />
      <ellipse cx="9" cy="12.5" rx="1.2" ry="1.5" />
      <ellipse cx="15" cy="12.5" rx="1.2" ry="1.5" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.9" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.7 7.4L3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 15.6-4.6Z" />
      <path d="m8.5 8.2.9.8-.7 1.3c.5 1.5 1.5 2.5 3 3l1.2-.8.9.7c-.2 1.2-.8 1.8-1.8 1.8-3.7-.3-6.7-3.3-7-7-.1-1 .4-1.6 1.5-1.8Z" />
    </>
  ),
  amazon: (
    <>
      <path d="M7 18.5c2.8 1.5 7.2 1.6 10.1.2M16.5 16.5l1.2 2.2-2.5.6" />
      <path d="m7 17 4-11h2l4 11M9 12.5h6" />
    </>
  ),
  stackoverflow: (
    <>
      <path d="M16.5 3v4h4.5M16.5 21v-4h4.5M5 17h11.5M5 12h13.5M5 7h15.5" />
    </>
  ),
  vercel: <path d="m12 3 9 17H3L12 3Z" fill="currentColor" stroke="none" />,
  custom: (
    <>
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="4.5" />
      <path d="M12 7.5v9M7.5 12h9" />
    </>
  ),
};

export default function BrandIcon({
  name,
  size = 20,
  className,
  title,
}: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {icons[name]}
    </svg>
  );
}
