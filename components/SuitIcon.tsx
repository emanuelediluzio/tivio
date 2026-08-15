import { Suit } from "@/lib/types";

const COLORS: Record<Suit, string> = {
  denari: "#c9971c",
  coppe: "#c23b3b",
  spade: "#2f3b52",
  bastoni: "#3f7d4f",
};

export function SuitIcon({ suit, className }: { suit: Suit; className?: string }) {
  const color = COLORS[suit];
  switch (suit) {
    case "denari":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <circle cx="12" cy="12" r="9" fill={color} />
          <circle cx="12" cy="12" r="9" stroke="#00000022" strokeWidth="1" />
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="#ffffffaa" strokeWidth="1.4" />
        </svg>
      );
    case "coppe":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M6 4h12c0 5.5-2.3 8.4-5 9.1V17h3v2H8v-2h3v-3.9C8.3 12.4 6 9.5 6 4Z"
            fill={color}
          />
          <rect x="9" y="19" width="6" height="1.6" rx="0.6" fill={color} />
        </svg>
      );
    case "spade":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M12 3l6 6-4.2 4.2c.6 1.6 2 2.6 3.7 2.8v1.2h-11v-1.2c1.7-.2 3.1-1.2 3.7-2.8L6 9l6-6Z"
            fill={color}
          />
          <rect x="11" y="16.5" width="2" height="4.5" rx="0.5" fill={color} />
        </svg>
      );
    case "bastoni":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <rect
            x="10.5"
            y="2"
            width="3"
            height="20"
            rx="1.5"
            fill={color}
            transform="rotate(18 12 12)"
          />
          <circle cx="16.3" cy="5.6" r="2.1" fill={color} />
          <circle cx="7.7" cy="18.4" r="2.1" fill={color} />
        </svg>
      );
  }
}
