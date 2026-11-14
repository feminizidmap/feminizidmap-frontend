function Icon({ size = 16, strokeWidth = 2.1, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function FunnelIcon({ size = 16 }) {
  return (
    <Icon size={size} strokeWidth={2.2}>
      <path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" />
    </Icon>
  );
}

export function ResetViewIcon({ size = 16 }) {
  return (
    <Icon size={size}>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      <circle cx="12" cy="12" r="2.2" />
    </Icon>
  );
}

export function ChevronUpIcon({ size = 14 }) {
  return (
    <Icon size={size} strokeWidth={2.6}>
      <path d="M6 15l6-6 6 6" />
    </Icon>
  );
}
