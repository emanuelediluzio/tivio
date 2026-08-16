import { CardT, RANK_LABELS, Suit } from "@/lib/types";
import { FaceFigure } from "./FaceFigure";
import { SuitIcon } from "./SuitIcon";

const RANK_SHORT: Record<number, string> = {
  1: "A",
  8: "F",
  9: "C",
  10: "R",
};

function shortRank(rank: number) {
  return RANK_SHORT[rank] ?? String(rank);
}

// Percentage positions (within the card body, below the corner index) for
// each pip count, in the classic two-column playing-card arrangement.
// Anything past the halfway mark gets flipped upright-for-the-bottom-half,
// same as a real deck.
const PIP_LAYOUT: Record<number, { x: number; y: number }[]> = {
  2: [
    { x: 50, y: 18 },
    { x: 50, y: 82 },
  ],
  3: [
    { x: 50, y: 15 },
    { x: 50, y: 50 },
    { x: 50, y: 85 },
  ],
  4: [
    { x: 28, y: 20 },
    { x: 72, y: 20 },
    { x: 28, y: 80 },
    { x: 72, y: 80 },
  ],
  5: [
    { x: 28, y: 18 },
    { x: 72, y: 18 },
    { x: 50, y: 50 },
    { x: 28, y: 82 },
    { x: 72, y: 82 },
  ],
  6: [
    { x: 28, y: 16 },
    { x: 72, y: 16 },
    { x: 28, y: 50 },
    { x: 72, y: 50 },
    { x: 28, y: 84 },
    { x: 72, y: 84 },
  ],
  7: [
    { x: 28, y: 12 },
    { x: 72, y: 12 },
    { x: 50, y: 30 },
    { x: 28, y: 52 },
    { x: 72, y: 52 },
    { x: 28, y: 86 },
    { x: 72, y: 86 },
  ],
};

function CardPips({ suit, rank }: { suit: Suit; rank: number }) {
  const layout = PIP_LAYOUT[rank];
  return (
    <div className="relative flex-1 w-full">
      {layout.map((pos, i) => (
        <div
          key={i}
          className="absolute w-[22%]"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) ${pos.y > 50 ? "rotate(180deg)" : ""}`,
          }}
        >
          <SuitIcon suit={suit} className="w-full h-auto" />
        </div>
      ))}
    </div>
  );
}

function CardBody({ card }: { card: CardT }) {
  if (card.rank === 1) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <SuitIcon suit={card.suit} className="w-11 h-11 drop-shadow-sm" />
      </div>
    );
  }
  if (card.rank >= 8) {
    return (
      <div className="flex-1 flex items-center justify-center px-1">
        <FaceFigure suit={card.suit} rank={card.rank as 8 | 9 | 10} className="h-full w-auto" />
      </div>
    );
  }
  return <CardPips suit={card.suit} rank={card.rank} />;
}

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div
      className={`aspect-[2/3] rounded-lg border-2 border-amber-100/40 shadow-md relative overflow-hidden flex items-center justify-center ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, #7a1f2b 0, #7a1f2b 6px, #601621 6px, #601621 12px)",
      }}
    >
      <div className="w-[46%] aspect-square rounded-full border-2 border-amber-100/70 bg-[#601621] flex items-center justify-center">
        <div className="w-[70%] aspect-square rounded-full border border-amber-100/50" />
      </div>
    </div>
  );
}

export function PlayingCard({
  card,
  className = "",
  highlight = false,
}: {
  card: CardT;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      title={`${RANK_LABELS[card.rank]} di ${card.suit}`}
      className={`aspect-[2/3] rounded-lg bg-stone-50 border-2 shadow-md flex flex-col justify-between p-1.5 select-none transition-transform ${
        highlight ? "border-amber-400 ring-4 ring-amber-300/70 scale-105" : "border-stone-300"
      } ${className}`}
    >
      <div className="flex items-center gap-1 text-stone-800 font-bold text-sm leading-none">
        <span>{shortRank(card.rank)}</span>
        <SuitIcon suit={card.suit} className="w-3.5 h-3.5" />
      </div>
      <CardBody card={card} />
      <div className="flex items-center gap-1 text-stone-800 font-bold text-sm leading-none self-end rotate-180">
        <span>{shortRank(card.rank)}</span>
        <SuitIcon suit={card.suit} className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

export function EmptySlot({ className = "" }: { className?: string }) {
  return (
    <div
      className={`aspect-[2/3] rounded-lg border-2 border-dashed border-white/25 ${className}`}
    />
  );
}
