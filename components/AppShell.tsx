"use client";

import { useState } from "react";
import { Game } from "./Game";
import { ModeMenu } from "./ModeMenu";
import { OnlineGame } from "./OnlineGame";

type Mode = "menu" | "cpu" | "online";

function readRoomFromUrl(): string | null {
  const room = new URLSearchParams(window.location.search).get("room");
  return room ? room.toUpperCase() : null;
}

export function AppShell() {
  const [roomFromUrl, setRoomFromUrl] = useState<string | null>(() => readRoomFromUrl());
  const [mode, setMode] = useState<Mode>(() => (readRoomFromUrl() ? "online" : "menu"));

  const backToMenu = () => {
    // Drop the ?room= param so a refresh doesn't try to rejoin.
    window.history.replaceState(null, "", window.location.pathname);
    setRoomFromUrl(null);
    setMode("menu");
  };

  if (mode === "cpu") return <Game onExit={backToMenu} />;
  if (mode === "online") return <OnlineGame initialRoomCode={roomFromUrl} onExit={backToMenu} />;

  return (
    <ModeMenu
      onSelectCpu={() => setMode("cpu")}
      onSelectOnline={() => setMode("online")}
    />
  );
}
