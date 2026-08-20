"use client";

import { useEffect, useRef, useState } from "react";
import {
  catchMisplay,
  clearPenaltyFlash,
  drawCard,
  judgeMove,
  Labels,
  newOnlineGame,
  playableTargets,
  resolveDraw,
  resolvePile,
} from "@/lib/engine";
import { useRoomConnection } from "@/lib/net";
import {
  GameState,
  PILE_PLAY_TARGETS,
  PLACEMENT_TARGETS,
  PilePlayTarget,
  PlacementTarget,
  PlayerId,
  RANK_LABELS,
  SUIT_LABELS,
} from "@/lib/types";
import { EmptySlot, PlayingCard } from "./PlayingCard";
import { PlayerZone } from "./PlayerZone";
import { RulesPanel } from "./RulesPanel";

type NetMessage =
  | { kind: "init"; state: GameState; yourSlot: PlayerId; labels: Labels }
  | { kind: "state"; state: GameState };

const OPTION_LABEL: Record<PlacementTarget, string> = {
  foundation: "Gioca sulla fondazione",
  opponent: "Scarica sull'avversario",
  discard: "Scarta sulla tua pila",
};

const PILE_OPTION_LABEL: Record<PilePlayTarget, string> = {
  foundation: "Gioca la cima della pila sulla fondazione",
  opponent: "Gioca la cima della pila sull'avversario",
};

export function OnlineGame({
  initialRoomCode,
  onExit,
}: {
  initialRoomCode: string | null;
  onExit: () => void;
}) {
  const [game, setGame] = useState<GameState | null>(null);
  const [mySlot, setMySlot] = useState<PlayerId | null>(null);
  const [labels, setLabels] = useState<Labels | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [selfNote, setSelfNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [joinInput, setJoinInput] = useState(initialRoomCode ?? "");

  const initSentRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const [hadConnected, setHadConnected] = useState(false);

  const onMessage = (data: unknown) => {
    const msg = data as NetMessage;
    if (msg.kind === "init") {
      setMySlot(msg.yourSlot);
      setLabels(msg.labels);
      setGame(msg.state);
    } else if (msg.kind === "state") {
      setGame(msg.state);
    }
  };

  const { status, code, error, send, hostRoom, joinRoom, disconnect } =
    useRoomConnection(onMessage);

  // Once connected, remember it forever (even after a later disconnect)
  // so the "peer left" screen only shows post-connection, not on a
  // failed initial join. Guarded by !hadConnected so this settles after
  // one extra render instead of looping.
  if (status === "connected" && !hadConnected) {
    setHadConnected(true);
  }

  // Host: once the joiner's data channel opens, deal the game and hand
  // off roles. Runs once per connection via initSentRef.
  useEffect(() => {
    if (status === "connected" && !mySlot && !initSentRef.current && code) {
      initSentRef.current = true;
      const freshLabels: Labels = { you: "Giocatore 1", cpu: "Giocatore 2" };
      const state = newOnlineGame(freshLabels);
      setLabels(freshLabels);
      setMySlot("you");
      setGame(state);
      send({ kind: "init", state, yourSlot: "cpu", labels: freshLabels });
    }
  }, [status, mySlot, code, send]);

  useEffect(() => {
    if (initialRoomCode) joinRoom(initialRoomCode);
    // Only auto-join once, from the link that started this session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [game?.log.length]);

  useEffect(() => {
    if (!game?.penaltyFlash) return;
    const t = setTimeout(() => setGame((g) => (g ? clearPenaltyFlash(g) : g)), 2200);
    return () => clearTimeout(t);
  }, [game?.penaltyFlash, game?.log.length]);

  useEffect(() => {
    if (!selfNote) return;
    const t = setTimeout(() => setSelfNote(null), 2600);
    return () => clearTimeout(t);
  }, [selfNote, game?.log.length]);

  const act = (updater: (g: GameState) => GameState) => {
    if (!game) return;
    const next = updater(game);
    setGame(next);
    send({ kind: "state", state: next });
  };

  // Private feedback for the player who just moved, so a fumble is not a
  // mystery. Kept in local state rather than the game log on purpose: the
  // log is shared, and telling the opponent about the slip would rob them
  // of having to spot it.
  const playCard = (target: PlacementTarget) => {
    if (!game || !mySlot || !labels) return;
    const verdict = judgeMove(game.playable, target);
    setSelfNote(
      verdict.reason === "illegal"
        ? "Quella carta lì non ci poteva andare: è finita sui tuoi scarti."
        : verdict.reason === "missed"
          ? "Quella carta potevi ancora giocarla..."
          : null
    );
    act((g) => resolveDraw(g, mySlot, target, labels));
  };

  // Your own pile's top card is also always live — same self-judged
  // always-on buttons as the flipped card, just aimed at foundations or
  // the opponent's pile.
  const playPileCard = (target: PilePlayTarget) => {
    if (!game || !mySlot || !labels) return;
    const oppSlot: PlayerId = mySlot === "you" ? "cpu" : "you";
    const card = game.players[mySlot].discard[game.players[mySlot].discard.length - 1];
    if (!card) return;
    const opponentTop =
      game.players[oppSlot].discard[game.players[oppSlot].discard.length - 1];
    const ok = playableTargets(card, game.foundations, opponentTop).includes(target);
    setSelfNote(
      ok ? null : "Quella carta lì non ci poteva andare: resta sulla tua pila."
    );
    act((g) => resolvePile(g, mySlot, target, labels));
  };

  const restart = () => {
    if (!labels) return;
    setSelfNote(null);
    const fresh = newOnlineGame(labels);
    setGame(fresh);
    send({ kind: "state", state: fresh });
  };

  const copy = async (text: string, kind: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard API unavailable — the code/link is visible to copy by hand.
    }
  };

  const roomUrl = code && typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?room=${code}`
    : "";

  // ---- Disconnected mid-game ----
  if (hadConnected && (status === "peer-left" || status === "error") && !game?.gameOver) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center gap-4 px-4 py-10 text-stone-50 text-center">
        <p className="text-lg font-semibold">
          {status === "peer-left" ? "Il tuo avversario si è disconnesso." : "Connessione persa."}
        </p>
        <button className="btn-primary" onClick={onExit}>
          Torna al menu
        </button>
      </div>
    );
  }

  // ---- Lobby (not connected yet) ----
  if (!game || !mySlot || !labels) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col gap-4 px-4 py-8 text-stone-50">
        <button onClick={onExit} className="btn-ghost self-start">
          ← Menu
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Partita online</h1>

        {status === "waiting" && code && (
          <div className="rounded-xl bg-black/25 border border-white/10 p-5 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-amber-100/70">
              Condividi questo codice o link con un amico
            </p>
            <div className="text-4xl font-bold tracking-[0.3em]">{code}</div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button className="btn-option" onClick={() => copy(code, "code")}>
                {copied === "code" ? "Copiato!" : "Copia codice"}
              </button>
              <button className="btn-option" onClick={() => copy(roomUrl, "link")}>
                {copied === "link" ? "Copiato!" : "Copia link"}
              </button>
            </div>
            <p className="text-xs text-amber-100/60 animate-pulse">
              In attesa che si unisca...
            </p>
          </div>
        )}

        {status === "connecting" && (
          <div className="rounded-xl bg-black/25 border border-white/10 p-5 text-center text-sm text-amber-100/70 animate-pulse">
            Connessione in corso...
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <>
            {error && (
              <div className="rounded-xl bg-rose-600/25 border border-rose-400/40 p-3 text-sm text-center">
                {error}
              </div>
            )}
            <div className="rounded-xl bg-black/25 border border-white/10 p-5 flex flex-col gap-3">
              <p className="text-sm font-semibold">Crea una stanza</p>
              <button className="btn-primary" onClick={hostRoom}>
                Crea partita online
              </button>
            </div>
            <div className="rounded-xl bg-black/25 border border-white/10 p-5 flex flex-col gap-3">
              <p className="text-sm font-semibold">Hai un codice?</p>
              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                maxLength={5}
                placeholder="ABCDE"
                aria-label="Codice della stanza"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-center tracking-[0.3em] text-lg uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              />
              <button
                className="btn-primary"
                disabled={joinInput.trim().length < 5}
                onClick={() => joinRoom(joinInput)}
              >
                Entra nella stanza
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- Connected: game board ----
  const oppSlot: PlayerId = mySlot === "you" ? "cpu" : "you";
  const me = game.players[mySlot];
  const opp = game.players[oppSlot];
  const myDiscardTop = me.discard[me.discard.length - 1];
  const oppDiscardTop = opp.discard[opp.discard.length - 1];
  const opponentName = labels[oppSlot];
  // Offered on every turn, never only when there is really something to
  // catch — otherwise the button itself would give the opponent's slip away.
  const canCatch = game.turn === mySlot && !game.flipped && !game.gameOver;
  const myTurn = game.turn === mySlot;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6 text-stone-50">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ti Vitti</h1>
          <p className="text-xs text-amber-100/70">Partita online contro {opponentName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRules((s) => !s)} className="btn-ghost">
            Regole
          </button>
          <button onClick={restart} className="btn-ghost">
            Nuova partita
          </button>
          <button
            onClick={() => {
              disconnect();
              onExit();
            }}
            className="btn-ghost"
          >
            Esci
          </button>
        </div>
      </header>

      {showRules && (
        <RulesPanel
          onClose={() => setShowRules(false)}
          opponentLabel={opponentName}
          variant="online"
        />
      )}

      {game.penaltyFlash && (
        <div
          key={game.log.length}
          className="animate-toast rounded-xl bg-amber-500/90 text-stone-900 font-semibold text-center py-2 text-sm shadow-lg"
        >
          Ti vitti!{" "}
          {game.penaltyFlash.target === mySlot ? "Tu prendi" : `${opponentName} prende`}{" "}
          {game.penaltyFlash.amount} cart{game.penaltyFlash.amount === 1 ? "a" : "e"} di
          penalità.
        </div>
      )}

      {selfNote && (
        <div
          key={`note-${game.log.length}`}
          className="animate-toast rounded-xl bg-black/50 border border-amber-300/40 text-amber-100 text-center py-2 text-sm"
        >
          {selfNote}
        </div>
      )}

      {game.gameOver && (
        <div
          className={`rounded-xl p-4 text-center font-semibold ${
            game.winner === mySlot
              ? "bg-emerald-600/30 border border-emerald-400/50"
              : "bg-rose-600/30 border border-rose-400/50"
          }`}
        >
          {game.winner === mySlot ? "Hai vinto! 🎉" : `Ha vinto ${opponentName}.`} —{" "}
          <button
            className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded"
            onClick={restart}
          >
            gioca ancora
          </button>
        </div>
      )}

      <PlayerZone
        name={opponentName}
        stockCount={opp.stock.length}
        discardTop={oppDiscardTop}
        align="start"
      />

      <div className="rounded-xl bg-black/20 border border-white/10 p-3 sm:p-4">
        <div className="text-xs uppercase tracking-wide text-amber-100/60 mb-2">Fondazioni</div>
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

      <PlayerZone name="Tu" stockCount={me.stock.length} discardTop={myDiscardTop} align="end" />

      <div className="rounded-xl bg-black/25 border border-white/10 p-3 sm:p-4 flex flex-col items-center justify-center gap-3 min-h-[6rem] sm:min-h-[9rem]">
        {canCatch && (
          <button
            onClick={() => act((g) => catchMisplay(g, mySlot, labels))}
            className="btn-option border-amber-400/50 text-amber-200"
            title={`Se ${opponentName} non ha sbagliato, le 3 carte le prendi tu`}
          >
            Ti vitti!
          </button>
        )}

        {!game.gameOver && myTurn && !game.flipped && (
          <div className="flex flex-col items-center gap-3">
            <button
              disabled={me.stock.length === 0}
              onClick={() => act((g) => drawCard(g, mySlot, labels))}
              className="btn-primary"
            >
              Pesca una carta
            </button>
            {myDiscardTop && (
              <div className="flex flex-wrap gap-2 justify-center">
                {PILE_PLAY_TARGETS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => playPileCard(opt)}
                    className="btn-option"
                  >
                    {PILE_OPTION_LABEL[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!game.gameOver && game.flipped && myTurn && (
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
                <button key={opt} onClick={() => playCard(opt)} className="btn-option">
                  {OPTION_LABEL[opt]}
                </button>
              ))}
            </div>
          </div>
        )}

        {!game.gameOver && !myTurn && (
          <div className="text-sm text-amber-100/70 animate-pulse">
            {opponentName} sta giocando...
          </div>
        )}
      </div>

      <div className="rounded-xl bg-black/20 border border-white/10 p-3 h-24 sm:h-32 overflow-y-auto text-xs text-amber-100/70 space-y-1">
        {game.log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
