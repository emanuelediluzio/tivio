import { CardT, SUITS } from "./types";

export function createDeck(): CardT[] {
  const deck: CardT[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 10; rank++) {
      deck.push({ id: `${suit}-${rank}`, suit, rank });
    }
  }
  return deck;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
