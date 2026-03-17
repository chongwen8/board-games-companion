"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PartySocket from "partysocket";

const RAW_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
const PARTYKIT_HOST = RAW_HOST.replace(/^https?:\/\//, "");

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") ?? "";
  const name = searchParams.get("name") ?? "Player";
  const [status, setStatus] = useState("Looking up session...");
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !code) return;
    attempted.current = true;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      party: "lobby",
      room: "main",
    });

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "LOOKUP_CODE", code }));
    });

    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "CODE_FOUND") {
        socket.close();
        router.replace(
          `/games/brass-birmingham/${msg.roomId}?action=join&name=${encodeURIComponent(name)}`
        );
      } else if (msg.type === "CODE_NOT_FOUND") {
        setStatus(`No session found for code "${code}"`);
        socket.close();
      }
    });

    const timer = setTimeout(() => {
      setStatus("Could not connect to server. Is it running?");
      socket.close();
    }, 5000);

    return () => {
      clearTimeout(timer);
      socket.close();
    };
  }, [code, name, router]);

  return <p className="text-muted-foreground">{status}</p>;
}

export default function JoinPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <Suspense
        fallback={
          <p className="text-muted-foreground">Looking up session...</p>
        }
      >
        <JoinContent />
      </Suspense>
    </main>
  );
}
