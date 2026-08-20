"use client";

import { useEffect, useRef, useState } from "react";
import {
  callTiVitti,
  clearPenaltyFlash,
  cpuStep,
  flipOwn,
  newGame,
  placeFlipped,
  playPile,
} from "@/lib/engine";
import {
  GameState,
  PILE_PLAY_TARGETS,
  PLACEMENT_TARGETS,
  PilePlayTarget,
  PlacementTarget,
  RANK_LABELS,
  SUIT_LABELS,
} from "@/lib/types";
import { EmptySlot, PlayingCard } from "./PlayingCard";
import { PlayerZone } from "./PlayerZone";
import { RulesPanel } from "./RulesPanel";

const OPTION_LABEL: Record<PlacementTarget, string> = {
  foundation: "Gioca sulla fondazione",
  opponent: "Scarica sul CPU",
  discard: "Scarta sulla tua pila",
};

const PILE_OPTION_LABEL: Record<PilePlayTarget, string> = {
  foundation: "Gioca la cima della pila sulla fondazione",
  opponent: "Gioca la cima della pila sul CPU",
};

export function Game({ onExit }: { onExit?: () => void }) {
  const [game, setGame] = useState<GameState>(() => newGame());
  const [showRules, setShowRules] = useState(false);
  const cpuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (game.gameOver || game.turn !== "cpu") return;
    cpuTimer.current = setTimeout(() => {
      setGame((g) => cpuStep(g));
    }, 750);
    return () => {
      if (cpuTimer.current) clearTimeout(cpuTimer.current);
    };
  }, [game]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [game.log.length]);

  useEffect(() => {
    if (!game.penaltyFlash) return;
    const t = setTimeout(() => setGame((g) => clearPenaltyFlash(g)), 2200);
    return () => clearTimeout(t);
  }, [game.penaltyFlash, game.log.length]);

  const you = game.players.you;
  const cpu = game.players.cpu;
  const youDiscardTop = you.discard[you.discard.length - 1];
  const cpuDiscardTop = cpu.discard[cpu.discard.length - 1];
  // Offered on every turn, never only when there is really something to
  // catch — otherwise the button itself would give the CPU's slip away.
  const canCatch = game.turn === "you" && !game.flipped && !game.gameOver;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6 text-stone-50">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ti Vitti</h1>
          <p className="text-xs text-amber-100/70">
            Il classico gioco di carte siciliano — sfida il CPU
          </p>
        </div>
        <div className="flex gap-2">
          {onExit && (
            <button onClick={onExit} className="btn-ghost">
              Menu
            </button>
          )}
          <button
            onClick={() => setShowRules((s) => !s)}
            className="btn-ghost"
          >
            Regole
          </button>
          <button onClick={() => setGame(newGame())} className="btn-ghost">
            Nuova partita
          </button>
        </div>
      </header>

      {showRules && <RulesPanel onClose={() => setShowRules(false)} />}

      {game.penaltyFlash && (
        <div
          key={game.log.length}
          className="animate-toast rounded-xl bg-amber-500/90 text-stone-900 font-semibold text-center py-2 text-sm shadow-lg"
        >
          Ti vitti! {game.penaltyFlash.target === "you" ? "Tu prendi" : "Il CPU prende"}{" "}
          {game.penaltyFlash.amount} cart{game.penaltyFlash.amount === 1 ? "a" : "e"} di
          penalità.
        </div>
      )}

      {game.gameOver && (
        <div
          className={`rounded-xl p-4 text-center font-semibold ${
            game.winner === "you"
              ? "bg-emerald-600/30 border border-emerald-400/50"
              : "bg-rose-600/30 border border-rose-400/50"
          }`}
        >
          {game.winner === "you" ? "Hai vinto! 🎉" : "Ha vinto il CPU."} —{" "}
          <button
            className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded"
            onClick={() => setGame(newGame())}
          >
            gioca ancora
          </button>
        </div>
      )}

      {/* CPU zone */}
      <PlayerZone
        name="CPU"
        stockCount={cpu.stock.length}
        discardTop={cpuDiscardTop}
        align="start"
      />

      {/* Foundations */}
      <div className="rounded-xl bg-black/20 border border-white/10 p-3 sm:p-4">
        <div className="text-xs uppercase tracking-wide text-amber-100/60 mb-2">
          Fondazioni
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md">
          {[0, 1, 2, 3].map((i) => {
            const pile = game.foundations[i];
            const top = pile?.cards[pile.cards.length - 1];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                {top ? (
                  <PlayingCard card={top} className="w-14 sm:w-16 md:w-20" />
                ) : (
                  <EmptySlot className="w-14 sm:w-16 md:w-20" />
                )}
                <span className="text-[10px] text-amber-100/50">
                  {pile ? `${pile.cards.length}/10` : "vuota"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your zone */}
      <PlayerZone
        name="Tu"
        stockCount={you.stock.length}
        discardTop={youDiscardTop}
        align="end"
      />

      {/* Action area */}
      <div className="rounded-xl bg-black/25 border border-white/10 p-3 sm:p-4 flex flex-col items-center justify-center gap-3 min-h-[6rem] sm:min-h-[9rem]">
        {canCatch && (
          <button
            onClick={() => setGame((g) => callTiVitti(g))}
            className="btn-option border-amber-400/50 text-amber-200"
            title="Se il CPU non ha sbagliato, le 3 carte le prendi tu"
          >
            Ti vitti!
          </button>
        )}

        {!game.gameOver && game.turn === "you" && !game.flipped && (
          <div className="flex flex-col items-center gap-3">
            <button
              disabled={you.stock.length === 0 && you.discard.length === 0}
              onClick={() => setGame((g) => flipOwn(g))}
              className="btn-primary"
            >
              {you.stock.length === 0 ? "Rigira la pila e pesca" : "Pesca una carta"}
            </button>
            {/* The top of your own pile stays live too: same self-judged
                always-on buttons as the flipped card, minus discard (it's
                already there). */}
            {youDiscardTop && (
              <div className="flex flex-wrap gap-2 justify-center">
                {PILE_PLAY_TARGETS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setGame((g) => playPile(g, opt))}
                    className="btn-option"
                  >
                    {PILE_OPTION_LABEL[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!game.gameOver && game.flipped && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm text-amber-100/80">
              Hai girato: <strong>{RANK_LABELS[game.flipped.rank]}</strong> di{" "}
              {SUIT_LABELS[game.flipped.suit]}
            </div>
            <PlayingCard
              key={game.flipped.id}
              card={game.flipped}
              className="w-20 sm:w-24 animate-flip-in"
            />
            {/* Always every option: working out which one is right is
                the game. Showing only the legal ones would hand over the
                answer and make "Ti vitti!" impossible to trigger. */}
            <div className="flex flex-wrap gap-2 justify-center">
              {PLACEMENT_TARGETS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setGame((g) => placeFlipped(g, opt))}
                  className="btn-option"
                >
                  {OPTION_LABEL[opt]}
                </button>
              ))}
            </div>
          </div>
        )}

        {!game.gameOver && game.turn === "cpu" && (
          <div className="text-sm text-amber-100/70 animate-pulse">
            Il CPU sta giocando...
          </div>
        )}
      </div>

      {/* Log */}
      <div className="rounded-xl bg-black/20 border border-white/10 p-3 h-24 sm:h-32 overflow-y-auto text-xs text-amber-100/70 space-y-1">
        {game.log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
