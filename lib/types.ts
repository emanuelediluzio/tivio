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

export interface PendingMisplay {
  owner: PlayerId;
  cardId: string;
}

export interface GameState {
  players: Record<PlayerId, PlayerState>;
  foundations: FoundationPile[];
  turn: PlayerId;
  flipped: CardT | null;
  options: PlacementTarget[];
  pendingMisplay: PendingMisplay | null;
  log: string[];
  winner: PlayerId | null;
  gameOver: boolean;
  penaltyFlash: { target: PlayerId; amount: number } | null;
}
