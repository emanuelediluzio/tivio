import { Suit } from "@/lib/types";

const COLORS: Record<Suit, string> = {
  denari: "#c9971c",
  coppe: "#b23b3b",
  spade: "#2f3b52",
  bastoni: "#3f7d4f",
};

const DARK: Record<Suit, string> = {
  denari: "#8a6512",
  coppe: "#7c2323",
  spade: "#161d29",
  bastoni: "#254f31",
};

export function SuitIcon({ suit, className }: { suit: Suit; className?: string }) {
  const color = COLORS[suit];
  const dark = DARK[suit];
  switch (suit) {
    case "denari":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="9.4" fill={color} stroke={dark} strokeWidth="0.6" />
          <circle
            cx="12"
            cy="12"
            r="7.6"
            fill="none"
            stroke="#ffffff70"
            strokeWidth="0.6"
          />
          {/* radiating sun rays */}
          <g stroke="#ffffffaa" strokeWidth="0.9" strokeLinecap="round">
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * Math.PI) / 4;
              const x1 = 12 + Math.sin(a) * 3.1;
              const y1 = 12 - Math.cos(a) * 3.1;
              const x2 = 12 + Math.sin(a) * 5.7;
              const y2 = 12 - Math.cos(a) * 5.7;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>
          <circle cx="12" cy="12" r="2" fill="#ffffff70" stroke={dark} strokeWidth="0.4" />
          {/* beaded rim */}
          <g fill={dark} opacity="0.55">
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i * Math.PI) / 8;
              const x = 12 + Math.sin(a) * 9.4;
              const y = 12 - Math.cos(a) * 9.4;
              return <circle key={i} cx={x} cy={y} r="0.35" />;
            })}
          </g>
        </svg>
      );
    case "coppe":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path
            d="M4.3 3.4h15.4c.3 2.6-.2 5-2 7-1.3 1.5-2.9 2.4-4.7 2.8v3.4h1.9c1 0 1.6.6 1.6 1.4H8.5c0-.8.6-1.4 1.6-1.4h1.9V13.2c-1.8-.4-3.4-1.3-4.7-2.8-1.8-2-2.3-4.4-2-7Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.5"
          />
          <path
            d="M6 4.6c-.1 2 .4 3.7 1.6 5.1.9 1.1 2 1.8 3.2 2.2"
            fill="none"
            stroke="#ffffff60"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          {/* side scrolls */}
          <path
            d="M4.3 4.4c-1.1.2-1.8 1-1.6 1.9.2.7.9 1.1 1.7 1"
            fill="none"
            stroke={color}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M19.7 4.4c1.1.2 1.8 1 1.6 1.9-.2.7-.9 1.1-1.7 1"
            fill="none"
            stroke={color}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M8.6 18.4c0-1.7 1.5-2.6 3.4-2.6s3.4.9 3.4 2.6v1.1H8.6Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.5"
          />
        </svg>
      );
    case "spade":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path
            d="M12 1.3 16 5.6 14 15.5h-4L8 5.6Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.6"
          />
          <line x1="12" y1="5" x2="12" y2="14.5" stroke="#ffffff6a" strokeWidth="1" />
          <path
            d="M4.7 16c2-1.9 5.1-2.2 7.3-.8 2.2-1.4 5.3-1.1 7.3.8-2 1.5-5.1 1.8-7.3.6-2.2 1.2-5.3.9-7.3-.6Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.6"
          />
          <rect x="10.6" y="16.3" width="2.8" height="4.4" rx="0.9" fill={color} stroke={dark} strokeWidth="0.5" />
          <circle cx="12" cy="21.2" r="1.9" fill={color} stroke={dark} strokeWidth="0.6" />
        </svg>
      );
    case "bastoni":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <g transform="rotate(20 12 12)">
            <path
              d="M10.5 1.6c-1.1 0-1.9.9-1.7 2l1.3 14.4c-.6 1.3-.4 2.9.6 4.1.5.6 1.2 1.1 2 1.4.8-.3 1.5-.8 2-1.4.9-1.2 1.1-2.8.6-4.1l1.3-14.4c.2-1.1-.6-2-1.7-2Z"
              fill={color}
              stroke={dark}
              strokeWidth="0.6"
            />
            <ellipse cx="12" cy="6.4" rx="2.3" ry="1.4" fill={dark} opacity="0.5" />
            <ellipse cx="12.2" cy="12.6" rx="2.3" ry="1.4" fill={dark} opacity="0.5" />
            <ellipse cx="12.4" cy="18.8" rx="2.5" ry="1.5" fill={dark} opacity="0.45" />
            <path
              d="M10 3.2c.4-.6 1.1-1 1.9-1s1.5.4 1.9 1"
              fill="none"
              stroke="#ffffff6a"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
      );
  }
}
