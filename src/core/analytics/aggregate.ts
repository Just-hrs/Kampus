import {
  DecodedPacket,
} from "./decoder";

export interface AggregatedUser {

  installId: string;

  totalSessions: number;

  totalTime: number;

  activeDays: number;

  pages: Record<
    string,
    {
      visits: number;
      totalTime: number;
    }
  >;
}

export function aggregatePackets(
  packets: DecodedPacket[]
): Record<
  string,
  AggregatedUser
> {

  const users: Record<
    string,
    AggregatedUser
  > = {};

  for (const packet of packets) {

    const installId =
      packet.installId;

    if (!users[installId]) {

      users[installId] = {

        installId,

        totalSessions: 0,

        totalTime: 0,

        activeDays: 0,

        pages: {},
      };
    }

    const user =
      users[installId];

    // ================= TOTALS =================

    user.totalSessions +=
      packet.sessions;

    user.totalTime +=
      packet.totalTime;

    user.activeDays += 1;

    // ================= PAGES =================

    for (const [
      screen,
      stats,
    ] of Object.entries(
      packet.pages
    )) {

      if (
        !user.pages[screen]
      ) {

        user.pages[screen] = {
          visits: 0,
          totalTime: 0,
        };
      }

      user.pages[
        screen
      ].visits +=
        stats.visits;

      user.pages[
        screen
      ].totalTime +=
        stats.totalTime;
    }
  }

  return users;
}

const aggregated =
  aggregatePackets([
    {
      version: 1,

      installId: "user_a",

      date: "2026-04-27",

      sessions: 3,

      totalTime: 5000,

      pages: {
        "/grades": {
          visits: 2,
          totalTime: 3000,
        },
      },
    },

    {
      version: 1,

      installId: "user_a",

      date: "2026-04-28",

      sessions: 2,

      totalTime: 4000,

      pages: {
        "/attendance": {
          visits: 1,
          totalTime: 2000,
        },

        "/grades": {
          visits: 1,
          totalTime: 1000,
        },
      },
    },
  ]);
