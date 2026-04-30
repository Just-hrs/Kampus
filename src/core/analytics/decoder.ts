export interface DecodedPacket {
  version: number;

  installId: string;

  date: string;

  sessions: number;

  totalTime: number;

  pages: Record<
    string,
    {
      visits: number;
      totalTime: number;
    }
  >;
}

export function decodePacket(
  packet: string
): DecodedPacket | null {

  try {

    // ============================================
    // detect legacy vs new separator
    // old  -> |
    // new  -> §
    // ============================================

    const separator =
      packet.includes("§")
        ? "§"
        : "|";

    // ============================================
    // TOP LEVEL
    // ============================================

    const parts =
      packet.split(separator);

    if (parts.length < 4) {

      console.warn(
        "[DECODE] invalid packet structure:",
        packet
      );

      return null;
    }

    const versionRaw =
      parts[0];

    if (
      !versionRaw.startsWith("v")
    ) {

      console.warn(
        "[DECODE] invalid version:",
        packet
      );

      return null;
    }

    const version =
      Number(
        versionRaw.slice(1)
      );

    const installId =
      parts[1];

    const date =
      parts[2];

    const result:
      DecodedPacket = {

      version,

      installId,

      date,

      sessions: 0,

      totalTime: 0,

      pages: {},
    };

    // ============================================
    // BLOCKS
    // ============================================

    for (
      let i = 3;
      i < parts.length;
      i++
    ) {

      const block =
        parts[i];

      // ============================================
      // SESSION BLOCK
      // S=67,T=1786038
      // ============================================

      if (
        block.startsWith("S=")
      ) {

        const cleaned =
          block.replace(
            "S=",
            ""
          );

        const [
          sessionPart,
          timePart,
        ] = cleaned.split(",");

        result.sessions =
          Number(
            sessionPart
          ) || 0;

        result.totalTime =
          Number(
            timePart?.replace(
              "T=",
              ""
            )
          ) || 0;
      }

      // ============================================
      // BEHAVIOR BLOCK
      // ============================================

      if (
        block.startsWith("B[")
      ) {

        const raw =
          block
            .replace(
              "B[",
              ""
            )
            .replace(
              "]",
              ""
            );

        if (!raw.trim()) {
          continue;
        }

        // old packets used |
        // new packets use ;
        const entrySeparator =
          separator === "§"
            ? ";"
            : "|";

        const entries =
          raw.split(
            entrySeparator
          );

        for (const entry of entries) {

          const trimmed =
            entry.trim();

          if (!trimmed) {
            continue;
          }

          const [
            screen,
            visits,
            totalTime,
          ] = trimmed.split("-");

          if (!screen) {
            continue;
          }

          result.pages[
            screen
          ] = {

            visits:
              Number(visits) || 0,

            totalTime:
              Number(totalTime) || 0,
          };
        }
      }
    }

    return result;

  } catch (err) {

    console.error(
      "[DECODE] failed:",
      err
    );

    return null;
  }
}