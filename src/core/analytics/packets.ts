import type { AnalyticsState } from "@/core/store";

export interface DailyBehaviorPacket {
  version: 1;

  deviceId: string;

  date: string;

  sessions: number;

  totalTime: number;

  screens: Array<{
    screen: string;
    visits: number;
    totalTime: number;
  }>;

  games: Array<{
    gameId: string;
    plays: number;
    totalTime: number;
  }>;
}

export function buildDailyBehaviorPacket(
  analytics: AnalyticsState
): DailyBehaviorPacket | null {
  if (!analytics.installId) {
    return null;
  }

  const today =
    new Date().toISOString().slice(0, 10);

  const daily =
    analytics.daily[today];

  if (!daily) {
    return null;
  }

  return {
    version: 1,

    deviceId: analytics.installId,

    date: today,

    sessions: daily.sessions,

    totalTime: daily.totalTime,

    screens: Object.entries(
      analytics.pages
    ).map(([screen, data]) => ({
      screen,
      visits: data.visits,
      totalTime: data.totalTime,
    })),

    games: Object.entries(
      analytics.games
    ).map(([gameId, data]) => ({
      gameId,
      plays: data.visits,
      totalTime: data.totalTime,
    })),
  };
}