"use client";

import { useEffect, useRef, useState } from "react";
import {
  callTiVitti,
  clearPenaltyFlash,
  cpuStep,
  flipOwn,
  newGame,
  placeFlipped,
} from "@/lib/engine";
import { GameState, PlacementTarget, RANK_LABELS, SUIT_LABELS } from "@/lib/types";
import { CardBack, EmptySlot, PlayingCard } from "./PlayingCard";
import { SuitIcon } from "./SuitIcon";

const OPTION_LABEL: Record<PlacementTarget, string> = {
  foundation: "Gioca sulla fondazione",
  opponent: "Scarica sul CPU",
  discard: "Scarta sulla tua pila",
};

export function Game() {
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
  const canCatch =
    !!game.pendingMisplay &&
    game.pendingMisplay.owner === "cpu" &&
    game.turn === "you" &&
    !game.flipped &&
    !game.gameOver;

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
        flaggedCardId={
          game.pendingMisplay?.owner === "cpu" ? game.pendingMisplay.cardId : undefined
        }
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
            className="btn-primary animate-pulse"
          >
            Ti vitti! Il CPU ha sbagliato
          </button>
        )}

        {!game.gameOver && game.turn === "you" && !game.flipped && (
          <button
            disabled={you.stock.length === 0}
            onClick={() => setGame((g) => flipOwn(g))}
            className="btn-primary"
          >
            Pesca una carta
          </button>
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
            <div className="flex flex-wrap gap-2 justify-center">
              {game.options.map((opt) => (
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

function PlayerZone({
  name,
  stockCount,
  discardTop,
  align,
  flaggedCardId,
}: {
  name: string;
  stockCount: number;
  discardTop: import("@/lib/types").CardT | undefined;
  align: "start" | "end";
  flaggedCardId?: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 ${
        align === "end" ? "flex-row-reverse" : ""
      }`}
    >
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
          <PlayingCard
            card={discardTop}
            className="w-14 sm:w-16 md:w-20"
            highlight={flaggedCardId === discardTop.id}
          />
        ) : (
          <EmptySlot className="w-14 sm:w-16 md:w-20" />
        )}
        <span className="text-[10px] text-amber-100/60">pila</span>
      </div>
      <div className="text-sm font-semibold text-amber-100/80">{name}</div>
    </div>
  );
}

function RulesPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-xl bg-black/40 border border-white/15 p-4 text-sm leading-relaxed space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base">Come si gioca</h2>
        <button onClick={onClose} className="text-amber-100/60 hover:text-amber-100">
          Chiudi
        </button>
      </div>
      <p>
        <strong>Ti Vitti</strong> (&quot;ti ho visto&quot;) è un tradizionale gioco di carte
        siciliano e calabrese, giocato con un mazzo da 40 carte. In questa versione
        digitale affronti il CPU seguendo un adattamento fedele delle regole
        classiche.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Il mazzo viene diviso a metà, a faccia in giù, tra te e il CPU. Non
          conosci le tue carte finché non le giri.
        </li>
        <li>
          Al tuo turno peschi la carta in cima al tuo mazzo. Se è un <strong>Asso</strong>,
          apri una nuova fondazione al centro e peschi di nuovo.
        </li>
        <li>
          Se la carta continua una fondazione dello stesso seme (es. un 5 di Denari
          su un 4 di Denari), puoi giocarla lì e pescare ancora.
        </li>
        <li>
          Se la carta è di un valore adiacente (+1 o −1) alla carta in cima alla
          pila di scarti dell&apos;avversario, puoi scaricarla lì e pescare ancora.
        </li>
        <li>
          Se non puoi fare nessuna di queste mosse, la carta è &quot;morta&quot; e va
          scartata sulla tua pila: il turno passa all&apos;avversario.
        </li>
        <li>
          Attenzione: se scarti una carta quando invece potevi giocarla, il CPU
          grida &quot;Ti vitti!&quot; e ti penalizza con 3 carte in più. Se invece è il
          CPU a sbagliare, puoi gridarlo tu cliccando il bottone che appare — le
          3 carte di penalità passeranno a lui.
        </li>
        <li>Vince chi esaurisce per primo il proprio mazzo.</li>
      </ul>
      <div className="flex items-center gap-2 pt-1 text-amber-100/60 text-xs">
        <SuitIcon suit="denari" className="w-4 h-4" />
        <SuitIcon suit="coppe" className="w-4 h-4" />
        <SuitIcon suit="spade" className="w-4 h-4" />
        <SuitIcon suit="bastoni" className="w-4 h-4" />
        <span>Denari, Coppe, Spade, Bastoni — Fante=8, Cavallo=9, Re=10.</span>
      </div>
    </div>
  );
}
