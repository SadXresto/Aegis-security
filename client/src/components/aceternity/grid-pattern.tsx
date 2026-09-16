// Aceternity-style Grid & Dot Pattern + Grid container (aceternity.com/components/grid-and-dot-backgrounds)
// These tiny SVG-pattern helpers ship in the same Aceternity registry family and
// power the "GridPattern" background used behind the features section.
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Grid Pattern — provides the SVG `pattern` used by the Grid background.
 */
export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = "4 2",
  className,
  ...props
}: React.ComponentProps<"svg"> & {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: string;
}) {
  const id = useId();
  return (
    <svg aria-hidden="true" className={className} {...props}>
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M${width} 0H0V${height}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Grid container — renders the pattern with a radial fade mask, sized to fill
 * its absolutely positioned parent.
 */
export function Grid({
  pattern,
  size,
  className,
}: {
  pattern?: number[][] | null;
  size?: number;
  className?: string;
}) {
  const p = new Map();
  if (pattern) {
    pattern.forEach((point, i) => {
      const [x, y] = point;
      p.set(`${x}-${y}`, i);
    });
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]",
        className
      )}
    >
      <GridPattern width={size ?? 40} height={size ?? 40} x={-1} y={-1} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export function generatePattern(): number[][] {
  const pattern: number[][] = [];
  for (let i = 0; i < 7; i++) {
    const x = (i * 5 + Math.floor(Math.random() * 100)) % 100;
    const y = Math.floor(Math.random() * 4) * 4;
    pattern.push([x, y]);
  }
  return pattern;
}
