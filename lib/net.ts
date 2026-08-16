"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DataConnection, Peer as PeerType, PeerError } from "peerjs";

// Peer-to-peer room connection over WebRTC (PeerJS), using PeerJS's free
// public cloud broker only for the initial handshake — once connected,
// game data flows directly between the two browsers. No backend of ours
// is involved, which also means no server-side persistence: if either
// tab is closed the room is gone.

export type RoomStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "connected"
  | "peer-left"
  | "error";

const ROOM_PREFIX = "tivio-tv-";
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

export function generateRoomCode(length = 5): string {
  return Array.from(
    { length },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  ).join("");
}

interface UseRoomConnection {
  status: RoomStatus;
  code: string | null;
  error: string | null;
  send: (data: unknown) => void;
  hostRoom: () => void;
  joinRoom: (code: string) => void;
  disconnect: () => void;
}

export function useRoomConnection(onMessage: (data: unknown) => void): UseRoomConnection {
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<PeerType | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const cleanup = useCallback(() => {
    connRef.current?.close();
    connRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const wireConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    conn.on("open", () => setStatus("connected"));
    conn.on("data", (data) => onMessageRef.current(data));
    conn.on("close", () => setStatus("peer-left"));
    conn.on("error", () => {
      setStatus("error");
      setError("Connessione interrotta.");
    });
  }, []);

  const hostRoom = useCallback(() => {
    cleanup();
    setStatus("connecting");
    setError(null);
    setCode(null);

    import("peerjs").then(({ default: Peer }) => {
      const attempt = (triesLeft: number) => {
        const roomCode = generateRoomCode();
        const peer = new Peer(ROOM_PREFIX + roomCode);
        peerRef.current = peer;

        peer.on("open", () => {
          setCode(roomCode);
          setStatus("waiting");
        });
        peer.on("connection", (conn) => {
          if (connRef.current) {
            conn.close();
            return;
          }
          wireConnection(conn);
        });
        peer.on("error", (err: PeerError<string>) => {
          if (err.type === "unavailable-id" && triesLeft > 0) {
            peer.destroy();
            attempt(triesLeft - 1);
            return;
          }
          setStatus("error");
          setError("Impossibile creare la stanza. Riprova.");
        });
      };
      attempt(3);
    });
  }, [cleanup, wireConnection]);

  const joinRoom = useCallback(
    (roomCode: string) => {
      cleanup();
      setStatus("connecting");
      setError(null);

      import("peerjs").then(({ default: Peer }) => {
        const peer = new Peer();
        peerRef.current = peer;

        peer.on("open", () => {
          const conn = peer.connect(ROOM_PREFIX + roomCode.trim().toUpperCase(), {
            reliable: true,
          });
          wireConnection(conn);
        });
        peer.on("error", (err: PeerError<string>) => {
          setStatus("error");
          setError(
            err.type === "peer-unavailable"
              ? "Codice non trovato. Controlla di averlo scritto giusto."
              : "Impossibile collegarsi. Riprova."
          );
        });
      });
    },
    [cleanup, wireConnection]
  );

  const send = useCallback((data: unknown) => {
    connRef.current?.send(data);
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("idle");
    setCode(null);
    setError(null);
  }, [cleanup]);

  return { status, code, error, send, hostRoom, joinRoom, disconnect };
}
