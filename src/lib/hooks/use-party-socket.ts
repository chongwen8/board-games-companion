"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import PartySocket from "partysocket";
import type { ServerMessage, ClientMessage } from "@/lib/games/brass-birmingham/messages";
import type { BrassGameState } from "@/lib/games/brass-birmingham/types";
import type { Session } from "@/lib/games/types";

const RAW_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
// PartySocket expects hostname only — strip any protocol prefix
const PARTYKIT_HOST = RAW_HOST.replace(/^https?:\/\//, "");

interface UsePartySocketOptions {
  roomId: string;
  onSession?: (session: Session) => void;
  onGameState?: (gameState: BrassGameState) => void;
  onError?: (message: string) => void;
  onSessionEnded?: () => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function usePartySocket({
  roomId,
  onSession,
  onGameState,
  onError,
  onSessionEnded,
  onConnectionChange,
}: UsePartySocketOptions) {
  const socketRef = useRef<PartySocket | null>(null);
  const [connected, setConnected] = useState(false);

  const onSessionRef = useRef(onSession);
  const onGameStateRef = useRef(onGameState);
  const onErrorRef = useRef(onError);
  const onSessionEndedRef = useRef(onSessionEnded);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onSessionRef.current = onSession;
    onGameStateRef.current = onGameState;
    onErrorRef.current = onError;
    onSessionEndedRef.current = onSessionEnded;
    onConnectionChangeRef.current = onConnectionChange;
  });

  useEffect(() => {
    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
    });

    socket.addEventListener("open", () => {
      setConnected(true);
      onConnectionChangeRef.current?.(true);
    });

    socket.addEventListener("close", () => {
      setConnected(false);
      onConnectionChangeRef.current?.(false);
    });

    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      switch (msg.type) {
        case "SESSION_CREATED":
        case "SESSION_UPDATED":
          onSessionRef.current?.(msg.session);
          break;
        case "GAME_STATE":
          onGameStateRef.current?.(msg.gameState);
          break;
        case "SESSION_ENDED":
          onSessionEndedRef.current?.();
          break;
        case "ERROR":
          onErrorRef.current?.(msg.message);
          break;
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId]);

  const send = useCallback((message: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(message));
  }, []);

  return { send, connected };
}
