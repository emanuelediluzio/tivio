import { CardT, RANK_LABELS } from "@/lib/types";
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

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div
      className={`aspect-[2/3] rounded-lg border-2 border-amber-100/40 shadow-md ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, #7a1f2b 0, #7a1f2b 6px, #601621 6px, #601621 12px)",
      }}
    />
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
      <div className="flex-1 flex items-center justify-center">
        <SuitIcon suit={card.suit} className="w-8 h-8" />
      </div>
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
