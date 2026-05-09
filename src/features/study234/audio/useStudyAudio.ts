import { useCallback, useRef, useState } from "react";

type WaveType = "alpha" | "beta" | "gamma" | "custom";

interface Wave {
  id: string;
  type: WaveType;
  name: string;
  url: string;
}

const defaultWaves: Record<Exclude<WaveType, "custom">, Wave> = {
  alpha: {
    id: "alpha",
    type: "alpha",
    name: "Alpha Waves",
    url: "/audio/alpha.mp3",
  },
  beta: {
    id: "beta",
    type: "beta",
    name: "Beta Waves",
    url: "/audio/beta.mp3",
  },
  gamma: {
    id: "gamma",
    type: "gamma",
    name: "Gamma Waves",
    url: "/audio/gamma.mp3",
  },
};

export function useStudyAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentWave, setCurrentWave] = useState<Wave | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fade = (target: number, duration = 500) => {
    const audio = audioRef.current;
    if (!audio) return;

    const step = 50;
    const delta = (target - audio.volume) / (duration / step);

    const interval = setInterval(() => {
      if (!audio) return;
      audio.volume = Math.max(0, Math.min(1, audio.volume + delta));

      if (
        (delta < 0 && audio.volume <= target) ||
        (delta > 0 && audio.volume >= target)
      ) {
        clearInterval(interval);
        audio.volume = target;
      }
    }, step);
  };

  const playWave = useCallback((wave: Wave) => {
    if (audioRef.current) {
      fade(0, 200);
      audioRef.current.pause();
    }

    const audio = new Audio(wave.url);
    audio.loop = true;
    audio.volume = 0;

    audioRef.current = audio;
    setCurrentWave(wave);

    audio.play().then(() => {
      setIsPlaying(true);
      fade(1, 800);
    });
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    fade(0, 400);
    setTimeout(() => {
      audio.pause();
      setIsPlaying(false);
    }, 400);
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play();
    setIsPlaying(true);
  }, []);

  const getWave = useCallback((type: WaveType) => {
    if (type === "custom") return null;
    return defaultWaves[type];
  }, []);

  return {
    playWave,
    stop,
    pause,
    resume,
    getWave,
    currentWave,
    isPlaying,
    defaultWaves,
  };
}