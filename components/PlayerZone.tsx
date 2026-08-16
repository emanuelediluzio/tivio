import { CardT } from "@/lib/types";
import { CardBack, EmptySlot, PlayingCard } from "./PlayingCard";

export function PlayerZone({
  name,
  stockCount,
  discardTop,
  align,
}: {
  name: string;
  stockCount: number;
  discardTop: CardT | undefined;
  align: "start" | "end";
}) {
  return (
    <div className={`flex items-center gap-4 ${align === "end" ? "flex-row-reverse" : ""}`}>
      <div className="flex flex-col items-center gap-1 w-14 sm:w-16 md:w-20">
        {stockCount > 0 ? (
          <CardBack className="w-14 sm:w-16 md:w-20" />
        ) : (
          <EmptySlot className="w-14 sm:w-16 md:w-20" />
        )}
        <span className="text-[10px] text-amber-100/60">{stockCount} carte</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-14 sm:w-16 md:w-20">
        {discardTop ? (
          <PlayingCard card={discardTop} className="w-14 sm:w-16 md:w-20" />
        ) : (
          <EmptySlot className="w-14 sm:w-16 md:w-20" />
        )}
        <span className="text-[10px] text-amber-100/60">pila</span>
      </div>
      <div className="text-sm font-semibold text-amber-100/80">{name}</div>
    </div>
  );
}
