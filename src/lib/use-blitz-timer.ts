"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addBlitzBonus,
  BLITZ_START_SECONDS,
  tickBlitzTimer,
} from "@/lib/blitz-timer";

export function useBlitzTimer(options: {
  active: boolean;
  onExpire: () => void;
  initialSeconds?: number;
}) {
  const { active, onExpire, initialSeconds = BLITZ_START_SECONDS } = options;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (active && !expiredRef.current) {
      setRunning(true);
      return;
    }
    setRunning(false);
  }, [active]);

  useEffect(() => {
    if (active) return;
    setSeconds(initialSeconds);
    expiredRef.current = false;
    setRunning(false);
  }, [active, initialSeconds]);

  useEffect(() => {
    if (!running) return;

    const intervalId = window.setInterval(() => {
      setSeconds((current) => {
        const { next, expired } = tickBlitzTimer(current);
        if (expired && !expiredRef.current) {
          expiredRef.current = true;
          setRunning(false);
          onExpireRef.current();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [running]);

  const addBonus = useCallback((amount: number) => {
    if (expiredRef.current || !running) return;
    setSeconds((current) => addBlitzBonus(current, amount));
  }, [running]);

  return { seconds, addBonus, running };
}
