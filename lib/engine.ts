import { createDeck, shuffle } from "./deck";
import {
  CardT,
  FoundationPile,
  GameState,
  MisplayReason,
  PlacementTarget,
  PlayerId,
} from "./types";

const CPU_MISPLAY_CHANCE = 0.16;
const PENALTY_CARDS = 3;
const MAX_LOG = 40;

function other(player: PlayerId): PlayerId {
  return player === "you" ? "cpu" : "you";
}

function dealtState(openingLog: string): GameState {
  const deck = shuffle(createDeck());
  const half = Math.ceil(deck.length / 2);
  return {
    players: {
      you: { stock: deck.slice(0, half), discard: [] },
      cpu: { stock: deck.slice(half), discard: [] },
    },
    foundations: [],
    turn: "you",
    flipped: null,
    playable: [],
    pendingMisplay: null,
    log: [openingLog],
    winner: null,
    gameOver: false,
    penaltyFlash: null,
  };
}

export function newGame(): GameState {
  return dealtState("Nuova partita! Tocca a te: pesca una carta.");
}

// Two-slot state, but framed for two human players connected online
// rather than you-vs-cpu. "you"/"cpu" are reused purely as internal
// slot keys (host/joiner); labels for display come from `Labels`.
export type Labels = Record<PlayerId, string>;

export function newOnlineGame(labels: Labels): GameState {
  return dealtState(`Partita iniziata! Tocca a ${labels.you}.`);
}

function pushLog(state: GameState, message: string): GameState {
  const log = [...state.log, message].slice(-MAX_LOG);
  return { ...state, log };
}

function foundationTargetIndex(
  card: CardT,
  foundations: FoundationPile[]
): number | "new" | null {
  const existingIndex = foundations.findIndex((f) => f.suit === card.suit);
  if (existingIndex >= 0) {
    const pile = foundations[existingIndex];
    const top = pile.cards[pile.cards.length - 1];
    if (top.rank === card.rank - 1) return existingIndex;
    return null;
  }
  if (card.rank === 1) return "new";
  return null;
}

function canPlayOpponent(card: CardT, opponentTop: CardT | undefined): boolean {
  if (!opponentTop) return false;
  return Math.abs(opponentTop.rank - card.rank) === 1;
}

/**
 * The productive placements this card actually admits. Discard is always
 * *available* to the player but is only *correct* when this list is empty,
 * so it is deliberately not included here.
 */
export function playableTargets(
  card: CardT,
  foundations: FoundationPile[],
  opponentTop: CardT | undefined
): PlacementTarget[] {
  const targets: PlacementTarget[] = [];
  if (foundationTargetIndex(card, foundations) !== null) targets.push("foundation");
  if (canPlayOpponent(card, opponentTop)) targets.push("opponent");
  return targets;
}

/**
 * Judge a chosen placement against what was actually possible. Every wrong
 * judgement is catchable, which is what keeps the player responsible for
 * reading the board instead of the button list.
 */
export function judgeMove(
  playable: PlacementTarget[],
  target: PlacementTarget
): { ok: boolean; reason: MisplayReason | null } {
  if (target === "discard") {
    // Correct only when there was genuinely nothing to do with the card.
    return playable.length === 0
      ? { ok: true, reason: null }
      : { ok: false, reason: "missed" };
  }
  return playable.includes(target)
    ? { ok: true, reason: null }
    : { ok: false, reason: "illegal" };
}

function misplayPhrase(reason: MisplayReason): string {
  switch (reason) {
    case "missed":
      return "aveva una mossa buona e ha scartato";
    case "illegal":
      return "giocato una carta dove non poteva andare";
    case "false-call":
      return "gridato Ti vitti! senza che ci fosse nulla da vedere";
  }
}

function applyPenalty(
  state: GameState,
  caught: PlayerId,
  catcher: PlayerId,
  reason: MisplayReason,
  labels?: Labels
): GameState {
  const catcherStock = [...state.players[catcher].stock];
  const move = catcherStock.splice(-PENALTY_CARDS, PENALTY_CARDS);
  const caughtStock = [move.reverse(), state.players[caught].stock].flat();

  const players = {
    ...state.players,
    [catcher]: { ...state.players[catcher], stock: catcherStock },
    [caught]: { ...state.players[caught], stock: caughtStock },
  };

  let next: GameState = {
    ...state,
    players,
    penaltyFlash: { target: caught, amount: move.length },
  };
  const caughtPhrase = labels
    ? `${labels[caught]} ha`
    : caught === "you"
      ? "Tu hai"
      : "Il CPU ha";
  const cards = `${move.length} cart${move.length === 1 ? "a" : "e"} in penalità.`;
  next = pushLog(
    next,
    reason === "false-call"
      ? `${caughtPhrase} ${misplayPhrase(reason)}: ${cards}`
      : `Ti vitti! ${caughtPhrase} ${misplayPhrase(reason)}: ${cards}`
  );
  return checkWinner(next, labels);
}

export function checkWinner(state: GameState, labels?: Labels): GameState {
  if (state.gameOver) return state;
  const youEmpty = state.players.you.stock.length === 0;
  const cpuEmpty = state.players.cpu.stock.length === 0;
  if (!youEmpty && !cpuEmpty) return state;
  const winner: PlayerId = youEmpty ? "you" : "cpu";
  const msg = labels
    ? `${labels[winner]} ha esaurito il mazzo per primo e vince la partita!`
    : winner === "you"
      ? "Hai esaurito il tuo mazzo per primo. Hai vinto!"
      : "Il CPU ha esaurito il mazzo per primo. Hai perso.";
  return pushLog({ ...state, winner, gameOver: true }, msg);
}

// ---- Human turn ----

export function flipOwn(state: GameState): GameState {
  if (state.gameOver || state.turn !== "you" || state.flipped) return state;
  let base = state;
  if (base.pendingMisplay && base.pendingMisplay.owner === "cpu") {
    base = pushLog({ ...base, pendingMisplay: null }, "Occasione persa per gridare Ti vitti!");
  }
  const stock = [...base.players.you.stock];
  const card = stock.pop();
  if (!card) return base;
  const players = { ...base.players, you: { ...base.players.you, stock } };
  const opponentTop = base.players.cpu.discard[base.players.cpu.discard.length - 1];
  const playable = playableTargets(card, base.foundations, opponentTop);
  let next: GameState = { ...base, players, flipped: card, playable };
  next = pushLog(next, `Hai girato: ${cardLabel(card)}.`);
  return next;
}

/**
 * In vs-CPU play the machine never misses a slip, so a wrong move is
 * punished on the spot rather than waiting for a call.
 */
export function placeFlipped(state: GameState, target: PlacementTarget): GameState {
  if (state.gameOver || state.turn !== "you" || !state.flipped) return state;

  const { next: placed, verdict } = applyPlacement(state, "you", target);
  let next = placed;

  if (!verdict.ok) {
    next = applyPenalty(next, "you", "cpu", verdict.reason!);
    if (next.gameOver) return next;
    return { ...next, turn: "cpu" };
  }

  // A good placement earns another flip; a correct discard ends the turn.
  return target === "discard" ? { ...next, turn: "cpu" } : next;
}

/**
 * Resolve a chosen placement into the board. A move that was not actually
 * available cannot land where it was aimed — the card falls onto the
 * player's own pile — and the returned verdict says whether it was an error.
 *
 * Note what does NOT happen here: the log never records the verdict. Both
 * kinds of error come to rest on the player's own pile and read exactly
 * like an ordinary discard, so an opponent watching the table has to judge
 * for themselves whether the card was still live. Spelling the mistake out
 * would hand over the very thing "Ti vitti!" is supposed to test — and in
 * online play the log is shared, so it would hand it to them directly.
 */
function applyPlacement(
  state: GameState,
  actor: PlayerId,
  target: PlacementTarget,
  labels?: Labels
): { next: GameState; verdict: { ok: boolean; reason: MisplayReason | null } } {
  const card = state.flipped!;
  const verdict = judgeMove(state.playable, target);
  const landed: PlacementTarget = verdict.ok ? target : "discard";
  const next = placeCard(state, actor, card, landed, labels);
  return { next: { ...next, flipped: null, playable: [] }, verdict };
}

function placeCard(
  state: GameState,
  actor: PlayerId,
  card: CardT,
  target: PlacementTarget,
  labels?: Labels
): GameState {
  let next = state;
  let message: string;

  if (target === "foundation") {
    const idx = foundationTargetIndex(card, next.foundations);
    let foundations = [...next.foundations];
    if (idx === "new") {
      foundations = [...foundations, { suit: card.suit, cards: [card] }];
    } else if (typeof idx === "number") {
      foundations = foundations.map((f, i) =>
        i === idx ? { ...f, cards: [...f.cards, card] } : f
      );
    }
    next = { ...next, foundations };
    message = `${actorLabel(actor, labels)} gioca ${cardLabel(card)} sulla fondazione.`;
  } else if (target === "opponent") {
    const opp = other(actor);
    const oppDiscard = [...next.players[opp].discard, card];
    next = {
      ...next,
      players: { ...next.players, [opp]: { ...next.players[opp], discard: oppDiscard } },
    };
    message = `${actorLabel(actor, labels)} scarica ${cardLabel(
      card
    )} sulla pila di ${actorLabel(opp, labels)}.`;
  } else {
    const discard = [...next.players[actor].discard, card];
    next = {
      ...next,
      players: { ...next.players, [actor]: { ...next.players[actor], discard } },
    };
    message = `${actorLabel(actor, labels)} scarta ${cardLabel(card)}.`;
  }

  next = pushLog(next, message);
  return checkWinner(next, labels);
}

/**
 * Shouting is always allowed while it is your turn. Deciding whether there
 * is actually something to shout about is the player's job — offering the
 * call only when a real slip exists would announce the slip — so a shout
 * into thin air costs the caller instead.
 */
export function callTiVitti(state: GameState): GameState {
  if (state.gameOver || state.turn !== "you" || state.flipped) return state;

  if (state.pendingMisplay && state.pendingMisplay.owner === "cpu") {
    const { reason } = state.pendingMisplay;
    return applyPenalty({ ...state, pendingMisplay: null }, "cpu", "you", reason);
  }
  return applyPenalty(state, "you", "cpu", "false-call");
}

export function clearPenaltyFlash(state: GameState): GameState {
  return state.penaltyFlash ? { ...state, penaltyFlash: null } : state;
}

// ---- Generic two-human turn (online play) ----

export function drawCard(state: GameState, actor: PlayerId, labels: Labels): GameState {
  if (state.gameOver || state.turn !== actor || state.flipped) return state;
  let base = state;
  if (base.pendingMisplay && base.pendingMisplay.owner !== actor) {
    base = pushLog(
      { ...base, pendingMisplay: null },
      "Occasione persa per gridare Ti vitti!"
    );
  }
  const stock = [...base.players[actor].stock];
  const card = stock.pop();
  if (!card) return base;
  const players = { ...base.players, [actor]: { ...base.players[actor], stock } };
  const opponent = other(actor);
  const opponentTop = base.players[opponent].discard[base.players[opponent].discard.length - 1];
  const playable = playableTargets(card, base.foundations, opponentTop);
  let next: GameState = { ...base, players, flipped: card, playable };
  next = pushLog(next, `${actorLabel(actor, labels)} gira: ${cardLabel(card)}.`);
  return next;
}

/**
 * Online play has no automatic referee: a wrong move is only flagged, and
 * costs nothing unless the opponent notices and calls it before their own
 * next draw.
 */
export function resolveDraw(
  state: GameState,
  actor: PlayerId,
  target: PlacementTarget,
  labels: Labels
): GameState {
  if (state.gameOver || state.turn !== actor || !state.flipped) return state;
  const card = state.flipped;

  const { next: placed, verdict } = applyPlacement(state, actor, target, labels);
  let next = placed;

  if (!verdict.ok) {
    next = { ...next, turn: other(actor) };
    if (!next.gameOver) {
      next = {
        ...next,
        pendingMisplay: { owner: actor, cardId: card.id, reason: verdict.reason! },
      };
    }
    return next;
  }

  return target === "discard" ? { ...next, turn: other(actor) } : next;
}

/** Online counterpart of {@link callTiVitti}: same always-available,
 *  always-risky shout. */
export function catchMisplay(state: GameState, caller: PlayerId, labels: Labels): GameState {
  if (state.gameOver || state.turn !== caller || state.flipped) return state;

  if (state.pendingMisplay && state.pendingMisplay.owner !== caller) {
    const { owner: caught, reason } = state.pendingMisplay;
    return applyPenalty({ ...state, pendingMisplay: null }, caught, caller, reason, labels);
  }
  return applyPenalty(state, caller, other(caller), "false-call", labels);
}

// ---- CPU turn: advance exactly one flip ----

export function cpuStep(state: GameState): GameState {
  if (state.gameOver || state.turn !== "cpu" || state.flipped) return state;
  const stock = [...state.players.cpu.stock];
  const card = stock.pop();
  if (!card) return state;

  const youTop = state.players.you.discard[state.players.you.discard.length - 1];
  const playable = playableTargets(card, state.foundations, youTop);

  let next: GameState = {
    ...state,
    players: { ...state.players, cpu: { ...state.players.cpu, stock } },
    flipped: card,
    playable,
  };
  next = pushLog(next, `Il CPU gira: ${cardLabel(card)}.`);

  // The CPU is careless now and then, in either direction: overlooking a
  // live card, or shoving one where it does not belong. Both are things
  // the player can pounce on with "Ti vitti!".
  const willMisplay = Math.random() < CPU_MISPLAY_CHANCE;
  const target: PlacementTarget = willMisplay
    ? playable.length > 0
      ? "discard"
      : "foundation"
    : (playable[0] ?? "discard");

  const { next: placed, verdict } = applyPlacement(next, "cpu", target);
  next = placed;

  if (!verdict.ok) {
    next = { ...next, turn: "you" };
    if (!next.gameOver) {
      next = {
        ...next,
        pendingMisplay: { owner: "cpu", cardId: card.id, reason: verdict.reason! },
      };
    }
    return next;
  }

  if (target === "discard") {
    next = { ...next, turn: "you" };
  }
  // otherwise bonus flip: stay on cpu turn, caller will invoke cpuStep again
  return next;
}

function actorLabel(p: PlayerId, labels?: Labels) {
  if (labels) return labels[p];
  return p === "you" ? "Tu" : "Il CPU";
}

function cardLabel(card: CardT) {
  const rankLabel: Record<number, string> = {
    1: "Asso",
    8: "Fante",
    9: "Cavallo",
    10: "Re",
  };
  const r = rankLabel[card.rank] ?? String(card.rank);
  const suit = card.suit[0].toUpperCase() + card.suit.slice(1);
  return `${r} di ${suit}`;
}
