"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { getDatabase, ref, set, onValue, remove } from "firebase/database";
import { useAuth } from "@/context/AuthProvider";
import { rtdb } from "@/config/firebase"; // Import Realtime Database

const LiveCursor = ({ workspaceId }) => {
  const { user } = useAuth();
  const [cursors, setCursors] = useState({});
  const lastSentRef = useRef(0);

  // Stable per-user color from a small palette
  const COLOR_PALETTE = useMemo(
    () => [
      "#EF4444", // red-500
      "#F59E0B", // amber-500
      "#10B981", // emerald-500
      "#3B82F6", // blue-500
      "#8B5CF6", // violet-500
      "#EC4899", // pink-500
      "#22D3EE", // cyan-400
      "#84CC16", // lime-500
      "#F97316", // orange-500
      "#14B8A6", // teal-500
      "#A855F7", // purple-500
      "#06B6D4", // sky-500
    ],
    []
  );

  const userColor = useMemo(() => {
    const seed = user?.uid || user?.displayName || "anon";
    let sum = 0;
    for (let i = 0; i < seed.length; i++) sum = (sum + seed.charCodeAt(i)) >>> 0;
    return COLOR_PALETTE[sum % COLOR_PALETTE.length];
  }, [user?.uid, user?.displayName, COLOR_PALETTE]);
  
  useEffect(() => {
    if (!user || !workspaceId) return;

    const cursorRef = ref(rtdb, `workspaces/${workspaceId}/cursors/${user.uid}`);

    const THROTTLE_MS = 50; // ~20 updates/second
    const handleMouseMove = (event) => {
      const now = Date.now();
      if (now - lastSentRef.current < THROTTLE_MS) return;
      lastSentRef.current = now;

      const { clientX, clientY } = event;

      // Throttled cursor update to Realtime Database
      set(cursorRef, {
        x: clientX,
        y: clientY,
        displayName: user.displayName || "Anonymous",
        color: userColor,
        timestamp: now,
      });
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Cleanup: Remove cursor when user leaves
    const handleDisconnect = () => remove(cursorRef);
    window.addEventListener("beforeunload", handleDisconnect);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("beforeunload", handleDisconnect);
      remove(cursorRef); // Remove cursor on component unmount
    };
  }, [user, workspaceId, userColor]);

  useEffect(() => {
    if (!workspaceId) return;

    const cursorsRef = ref(rtdb, `workspaces/${workspaceId}/cursors`);

    // Listen for real-time cursor updates
    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      setCursors(snapshot.val() || {});
    });

    return () => unsubscribe();
  }, [workspaceId]);

  return (
    <div>
      {Object.entries(cursors).map(([userId, cursor]) =>
        userId !== user?.uid && cursor ? (
          <div
            key={userId}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: cursor?.x || 0, // Fallback to 0 if undefined
              top: cursor?.y || 0, // Fallback to 0 if undefined
            }}
          >
            {/* Cursor SVG */}
           

            {/* User Display Name */}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-700 text-white px-2 py-1 rounded shadow-md">
                <svg
                className="absolute w-8 h-8 -top-6 left-1/2 -translate-x-1/2"
                viewBox="0 0 24 24"
                fill={cursor?.color || "#ffffff"}
                xmlns="http://www.w3.org/2000/svg"
                >
                <path d="M4 4L20 12L12 20L4 4Z" />
                </svg>
              {cursor?.displayName || "Anonymous"}
            </span>
          </div>
        ) : null
      )}
    </div>
  );
};

export default LiveCursor;
