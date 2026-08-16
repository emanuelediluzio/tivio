import { createDeck, shuffle } from "./deck";
import {
  CardT,
  FoundationPile,
  GameState,
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
    options: [],
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

export function legalOptions(
  card: CardT,
  foundations: FoundationPile[],
  opponentTop: CardT | undefined
): PlacementTarget[] {
  const options: PlacementTarget[] = [];
  if (foundationTargetIndex(card, foundations) !== null) options.push("foundation");
  if (canPlayOpponent(card, opponentTop)) options.push("opponent");
  options.push("discard");
  return options;
}

function applyPenalty(
  state: GameState,
  caught: PlayerId,
  catcher: PlayerId,
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
  next = pushLog(
    next,
    `Ti vitti! ${caughtPhrase} sbagliato una mossa: ${move.length} cart${
      move.length === 1 ? "a" : "e"
    } in penalità.`
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
  const options = legalOptions(card, base.foundations, opponentTop);
  let next: GameState = { ...base, players, flipped: card, options };
  next = pushLog(next, `Hai girato: ${cardLabel(card)}.`);
  return next;
}

export function placeFlipped(state: GameState, target: PlacementTarget): GameState {
  if (state.gameOver || state.turn !== "you" || !state.flipped) return state;
  const card = state.flipped;
  const hadBetter = state.options.includes("foundation") || state.options.includes("opponent");
  const isMisplay = target === "discard" && hadBetter;

  let next = placeCard(state, "you", card, target);
  next = { ...next, flipped: null, options: [] };

  if (isMisplay) {
    next = pushLog(next, "Hai scartato una carta giocabile...");
    next = applyPenalty(next, "you", "cpu");
    if (next.gameOver) return next;
    next = { ...next, turn: "cpu" };
    return next;
  }

  if (target === "discard") {
    next = { ...next, turn: "cpu" };
  }
  // otherwise: bonus flip, stay on "you" turn
  return next;
}

function placeCard(
  state: GameState,
  actor: PlayerId,
  card: CardT,
  target: PlacementTarget,
  labels?: Labels
): GameState {
  let next = state;
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
    next = pushLog(
      next,
      `${actorLabel(actor, labels)} gioca ${cardLabel(card)} sulla fondazione.`
    );
  } else if (target === "opponent") {
    const opp = other(actor);
    const oppDiscard = [...next.players[opp].discard, card];
    next = {
      ...next,
      players: { ...next.players, [opp]: { ...next.players[opp], discard: oppDiscard } },
    };
    next = pushLog(
      next,
      `${actorLabel(actor, labels)} scarica ${cardLabel(card)} sulla pila di ${actorLabel(
        opp,
        labels
      )}.`
    );
  } else {
    const discard = [...next.players[actor].discard, card];
    next = {
      ...next,
      players: { ...next.players, [actor]: { ...next.players[actor], discard } },
    };
    next = pushLog(next, `${actorLabel(actor, labels)} scarta ${cardLabel(card)}.`);
  }
  return checkWinner(next, labels);
}

export function callTiVitti(state: GameState): GameState {
  if (state.gameOver || !state.pendingMisplay || state.pendingMisplay.owner !== "cpu") {
    return state;
  }
  let next: GameState = { ...state, pendingMisplay: null };
  next = applyPenalty(next, "cpu", "you");
  return next;
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
  const options = legalOptions(card, base.foundations, opponentTop);
  let next: GameState = { ...base, players, flipped: card, options };
  next = pushLog(next, `${actorLabel(actor, labels)} gira: ${cardLabel(card)}.`);
  return next;
}

export function resolveDraw(
  state: GameState,
  actor: PlayerId,
  target: PlacementTarget,
  labels: Labels
): GameState {
  if (state.gameOver || state.turn !== actor || !state.flipped) return state;
  const card = state.flipped;
  const hadBetter = state.options.includes("foundation") || state.options.includes("opponent");

  let next = placeCard(state, actor, card, target, labels);
  next = { ...next, flipped: null, options: [] };

  if (target === "discard") {
    next = { ...next, turn: other(actor) };
    if (hadBetter && !next.gameOver) {
      next = { ...next, pendingMisplay: { owner: actor, cardId: card.id } };
    }
  }
  // otherwise: bonus flip, actor keeps the turn
  return next;
}

export function catchMisplay(state: GameState, caller: PlayerId, labels: Labels): GameState {
  if (state.gameOver || !state.pendingMisplay || state.pendingMisplay.owner === caller) {
    return state;
  }
  const caught = state.pendingMisplay.owner;
  let next: GameState = { ...state, pendingMisplay: null };
  next = applyPenalty(next, caught, caller, labels);
  return next;
}

// ---- CPU turn: advance exactly one flip ----

export function cpuStep(state: GameState): GameState {
  if (state.gameOver || state.turn !== "cpu" || state.flipped) return state;
  const stock = [...state.players.cpu.stock];
  const card = stock.pop();
  if (!card) return state;

  let next: GameState = {
    ...state,
    players: { ...state.players, cpu: { ...state.players.cpu, stock } },
  };
  next = pushLog(next, `Il CPU gira: ${cardLabel(card)}.`);

  const youTop = next.players.you.discard[next.players.you.discard.length - 1];
  const options = legalOptions(card, next.foundations, youTop);
  const hasBetter = options.includes("foundation") || options.includes("opponent");

  const willMisplay = hasBetter && Math.random() < CPU_MISPLAY_CHANCE;

  let target: PlacementTarget;
  if (willMisplay) {
    target = "discard";
  } else if (options.includes("foundation")) {
    target = "foundation";
  } else if (options.includes("opponent")) {
    target = "opponent";
  } else {
    target = "discard";
  }

  next = placeCard(next, "cpu", card, target);

  if (willMisplay) {
    next = pushLog(next, "Il CPU sembra essersi distratto...");
    next = { ...next, pendingMisplay: { owner: "cpu", cardId: card.id }, turn: "you" };
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
