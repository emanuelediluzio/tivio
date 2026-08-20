export type Suit = "denari" | "coppe" | "spade" | "bastoni";

export const SUITS: Suit[] = ["denari", "coppe", "spade", "bastoni"];

export const SUIT_LABELS: Record<Suit, string> = {
  denari: "Denari",
  coppe: "Coppe",
  spade: "Spade",
  bastoni: "Bastoni",
};

export const RANK_LABELS: Record<number, string> = {
  1: "Asso",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "Fante",
  9: "Cavallo",
  10: "Re",
};

export interface CardT {
  id: string;
  suit: Suit;
  rank: number; // 1..10
}

export type PlayerId = "you" | "cpu";

export interface PlayerState {
  stock: CardT[]; // face down, draw from the end (top)
  discard: CardT[]; // face up own pile, top = last item
}

export interface FoundationPile {
  suit: Suit;
  cards: CardT[]; // built 1 -> 10, top = last item
}

export type PlacementTarget = "foundation" | "opponent" | "discard";

export const PLACEMENT_TARGETS: PlacementTarget[] = [
  "foundation",
  "opponent",
  "discard",
];

// The top card of your own discard pile is also always live — same two
// destinations as a freshly-flipped card, minus "discard" (it's already
// there).
export type PilePlayTarget = "foundation" | "opponent";

export const PILE_PLAY_TARGETS: PilePlayTarget[] = ["foundation", "opponent"];

// Why someone is taking penalty cards:
// - "missed": the card was playable, but it got discarded anyway.
// - "illegal": it was played somewhere it could not legally go.
// - "false-call": "Ti vitti!" was shouted when there was nothing to catch,
//   which costs the caller instead.
export type MisplayReason = "missed" | "illegal" | "false-call";

export interface PendingMisplay {
  owner: PlayerId;
  cardId: string;
  reason: MisplayReason;
}

export interface GameState {
  players: Record<PlayerId, PlayerState>;
  foundations: FoundationPile[];
  turn: PlayerId;
  flipped: CardT | null;
  // Where the flipped card could legitimately go ("foundation"/"opponent";
  // empty means the card is dead and discarding is the right call). Used to
  // judge the move after the fact — deliberately NOT used to build the
  // button list, since spotting playable cards is the player's job.
  playable: PlacementTarget[];
  pendingMisplay: PendingMisplay | null;
  log: string[];
  winner: PlayerId | null;
  gameOver: boolean;
  penaltyFlash: { target: PlayerId; amount: number } | null;
}
