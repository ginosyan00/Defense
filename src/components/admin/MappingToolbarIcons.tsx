type IconProps = {
  size?: number;
};

function iconProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
}

export function SelectCursorIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)}>
      <path d="M4 4l7.5 16 1.8-6.2L20 11.5 4 4Z" />
    </svg>
  );
}

export function MarkerPinIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)}>
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

export function PolygonShapeIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)}>
      <path d="M7 4h10l4 8-4 8H7L3 12 7 4Z" />
    </svg>
  );
}

export function SaveCheckIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)}>
      <path d="M20 7 10 17l-5-5" />
    </svg>
  );
}

export function TrashPointIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function UndoPointIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

export function ClearPointsIcon({ size = 16 }: IconProps) {
  return (
    <svg {...iconProps(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
