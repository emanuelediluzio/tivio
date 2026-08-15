"use client";

import { useEffect, useRef, useState } from "react";
import {
  callTiVitti,
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
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-4 px-4 py-6 text-stone-50">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ti Vitti</h1>
          <p className="text-xs text-amber-100/70">
            Il classico gioco di carte siciliano — sfida il CPU
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRules((s) => !s)}
            className="px-3 py-1.5 text-sm rounded-full border border-white/20 hover:bg-white/10 transition"
          >
            Regole
          </button>
          <button
            onClick={() => setGame(newGame())}
            className="px-3 py-1.5 text-sm rounded-full border border-white/20 hover:bg-white/10 transition"
          >
            Nuova partita
          </button>
        </div>
      </header>

      {showRules && <RulesPanel onClose={() => setShowRules(false)} />}

      {game.gameOver && (
        <div
          className={`rounded-xl p-4 text-center font-semibold ${
            game.winner === "you"
              ? "bg-emerald-600/30 border border-emerald-400/50"
              : "bg-rose-600/30 border border-rose-400/50"
          }`}
        >
          {game.winner === "you" ? "Hai vinto! 🎉" : "Ha vinto il CPU."} —{" "}
          <button className="underline" onClick={() => setGame(newGame())}>
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
      <div className="rounded-xl bg-black/20 border border-white/10 p-4">
        <div className="text-xs uppercase tracking-wide text-amber-100/60 mb-2">
          Fondazioni
        </div>
        <div className="grid grid-cols-4 gap-3 max-w-md">
          {[0, 1, 2, 3].map((i) => {
            const pile = game.foundations[i];
            const top = pile?.cards[pile.cards.length - 1];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                {top ? <PlayingCard card={top} className="w-16" /> : <EmptySlot className="w-16" />}
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
      <div className="rounded-xl bg-black/25 border border-white/10 p-4 flex flex-col items-center gap-3 min-h-[9rem]">
        {canCatch && (
          <button
            onClick={() => setGame((g) => callTiVitti(g))}
            className="px-5 py-2 rounded-full bg-amber-500 text-stone-900 font-bold shadow-lg animate-pulse hover:bg-amber-400 transition"
          >
            Ti vitti! Il CPU ha sbagliato
          </button>
        )}

        {!game.gameOver && game.turn === "you" && !game.flipped && (
          <button
            disabled={you.stock.length === 0}
            onClick={() => setGame((g) => flipOwn(g))}
            className="px-6 py-2.5 rounded-full bg-amber-500 text-stone-900 font-bold shadow-lg hover:bg-amber-400 transition disabled:opacity-40"
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
            <PlayingCard card={game.flipped} className="w-20" />
            <div className="flex flex-wrap gap-2 justify-center">
              {game.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setGame((g) => placeFlipped(g, opt))}
                  className="px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition text-sm"
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
      <div className="rounded-xl bg-black/20 border border-white/10 p-3 h-32 overflow-y-auto text-xs text-amber-100/70 space-y-1">
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
      <div className="flex flex-col items-center gap-1 w-16">
        {stockCount > 0 ? <CardBack className="w-16" /> : <EmptySlot className="w-16" />}
        <span className="text-[10px] text-amber-100/60">{stockCount} carte</span>
      </div>
      <div className="flex flex-col items-center gap-1 w-16">
        {discardTop ? (
          <PlayingCard
            card={discardTop}
            className="w-16"
            highlight={flaggedCardId === discardTop.id}
          />
        ) : (
          <EmptySlot className="w-16" />
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
