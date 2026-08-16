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

const SKIN = "#f0dcbb";
const SKIN_DARK = "#c9a878";
const GOLD = "#d9b23c";

function SuitBadge({ suit, x, y, size }: { suit: Suit; x: number; y: number; size: number }) {
  const color = COLORS[suit];
  const dark = DARK[suit];
  const s = size / 24;
  switch (suit) {
    case "denari":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <circle cx="12" cy="12" r="9" fill={color} stroke={dark} strokeWidth="0.8" />
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="#ffffff80" strokeWidth="1" />
        </g>
      );
    case "coppe":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <path
            d="M5 4h14c0 5-2 8-7 9-5-1-7-4-7-9Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.8"
          />
          <rect x="10.5" y="13" width="3" height="6" fill={color} stroke={dark} strokeWidth="0.6" />
        </g>
      );
    case "spade":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <path
            d="M12 2 16 7 13 17h-2L8 7Z"
            fill={color}
            stroke={dark}
            strokeWidth="0.8"
          />
          <rect x="11" y="17" width="2" height="4" fill={color} stroke={dark} strokeWidth="0.5" />
        </g>
      );
    case "bastoni":
      return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <rect
            x="10.5"
            y="2"
            width="3"
            height="19"
            rx="1.4"
            fill={color}
            stroke={dark}
            strokeWidth="0.7"
            transform="rotate(18 12 12)"
          />
        </g>
      );
  }
}

function Crown({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  const h = w * 0.62;
  const half = w / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* band */}
      <rect x={-half} y={h * 0.55} width={w} height={h * 0.3} fill={GOLD} stroke="#8a6a12" strokeWidth="1.6" />
      {/* five points */}
      <path
        d={`M${-half},${h * 0.6} L${-half},${h * 0.1} L${-half * 0.55},${h * 0.42} L${
          -half * 0.28
        },${-h * 0.1} L0,${h * 0.3} L${half * 0.28},${-h * 0.1} L${half * 0.55},${h * 0.42} L${half},${
          h * 0.1
        } L${half},${h * 0.6} Z`}
        fill={GOLD}
        stroke="#8a6a12"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx={-half * 0.28} cy={-h * 0.1} r={w * 0.045} fill="#fff3c4" />
      <circle cx={half * 0.28} cy={-h * 0.1} r={w * 0.045} fill="#fff3c4" />
      <circle cx={0} cy={h * 0.3 - h * 0.18} r={w * 0.05} fill="#fff3c4" />
      {/* jewel on the band */}
      <circle cx={0} cy={h * 0.7} r={w * 0.045} fill={color} />
    </g>
  );
}

/** Flat, folk-art style illustration for the Fante/Cavallo/Re face cards. */
export function FaceFigure({
  suit,
  rank,
  className = "",
}: {
  suit: Suit;
  rank: 8 | 9 | 10;
  className?: string;
}) {
  const color = COLORS[suit];
  const dark = DARK[suit];

  return (
    <svg viewBox="0 0 100 150" className={className}>
      {rank === 9 && (
        <g>
          {/* horse, facing right: body first, then neck+head overlapping it
              so the join reads as one animal, then ear and legs on top */}
          <path
            d="M14 130c-8 4-11 12-5 17 5 4 11 2 14-3"
            fill="none"
            stroke={dark}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <ellipse cx="46" cy="118" rx="32" ry="14" fill={SKIN_DARK} stroke={dark} strokeWidth="2" />
          <path
            d="M64 112 C70 98 76 80 80 60 C83 54 88 53 92 56 L98 63 C93 68 88 70 84 73 C80 78 76 84 73 90 C70 98 68 106 66 114 Z"
            fill={SKIN_DARK}
            stroke={dark}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M78 55 L82 44 L86 55Z" fill={SKIN_DARK} stroke={dark} strokeWidth="1.6" strokeLinejoin="round" />
          {[16, 28, 58, 70].map((lx, i) => (
            <rect key={i} x={lx} y="128" width="8" height="19" rx="2.2" fill={SKIN_DARK} stroke={dark} strokeWidth="1.4" />
          ))}
        </g>
      )}

      {/* legs (Fante / Re only — Cavallo's are hidden behind the horse) */}
      {rank !== 9 && (
        <g>
          <rect x="38" y="118" width="9" height="28" rx="2" fill={dark} />
          <rect x="53" y="118" width="9" height="28" rx="2" fill={dark} />
        </g>
      )}

      {/* robe */}
      <path
        d={
          rank === 9
            ? "M34 55 L66 55 L76 109 L24 109 Z"
            : "M32 52 L68 52 L80 128 L20 128 Z"
        }
        fill={color}
        stroke={dark}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* belt / trim */}
      <rect
        x={rank === 9 ? 26 : 21}
        y={rank === 9 ? 80 : 92}
        width={rank === 9 ? 48 : 58}
        height="6"
        fill={GOLD}
        opacity="0.85"
      />

      {/* far arm */}
      <path
        d="M34 58 C24 62 20 72 22 82"
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* staff / lance / scepter */}
      {rank === 9 ? (
        <g>
          <line x1="70" y1="95" x2="90" y2="45" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          <SuitBadge suit={suit} x={82} y={30} size={16} />
        </g>
      ) : rank === 8 ? (
        <g>
          <line x1="70" y1="120" x2="70" y2="20" stroke={dark} strokeWidth="3.5" strokeLinecap="round" />
          <SuitBadge suit={suit} x={61} y={4} size={18} />
        </g>
      ) : (
        <g>
          <line x1="68" y1="105" x2="68" y2="60" stroke={dark} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="68" cy="55" r="6" fill={GOLD} stroke="#8a6a12" strokeWidth="1.4" />
        </g>
      )}

      {/* near arm, drawn over the staff */}
      <path
        d="M66 58 C77 62 81 72 79 82"
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* head */}
      <circle cx="50" cy="34" r="16" fill={SKIN} stroke={dark} strokeWidth="2" />
      {/* simple facial hint */}
      <circle cx="45" cy="33" r="1.4" fill={dark} />
      <circle cx="55" cy="33" r="1.4" fill={dark} />
      <path d="M45 40 Q50 43 55 40" fill="none" stroke={dark} strokeWidth="1.3" strokeLinecap="round" />

      {/* collar */}
      <path
        d="M38 48 Q50 56 62 48"
        fill="none"
        stroke={rank === 10 ? "#ffffff" : GOLD}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {rank === 10 ? (
        <Crown x={50} y={14} w={38} color={color} />
      ) : (
        <path
          d={`M${50 - 15},20 L${50 - 8},9 L${50},17 L${50 + 8},9 L${50 + 15},20 Z`}
          fill={color}
          stroke={dark}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
