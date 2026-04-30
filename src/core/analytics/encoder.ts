interface EncodableDay {
  date: string;

  data: {
    sessions: number;
    totalTime: number;

    pages: Record<
      string,
      {
        visits: number;
        totalTime: number;
      }
    >;
  };
}

export function encodeAnalyticsPacket(
  installId: string,
  payload: EncodableDay
): string {

  const {
    date,
    data,
  } = payload;

  const sections: string[] = [];

  // ================= SESSION BLOCK =================

  sections.push(
    `S=${data.sessions},T=${data.totalTime}`
  );

  // ================= BEHAVIOR BLOCK =================

  const pageEntries =
    Object.entries(data.pages);

  if (pageEntries.length > 0) {

    const behavior =
      pageEntries.map(
        ([screen, stats]) =>
          `${screen}-${stats.visits}-${stats.totalTime}`
      );

    sections.push(
      `B[${behavior.join(";")}]`
    );
  }

  // ================= FINAL PACKET =================

  return [
    "v1",
    installId,
    date,
    ...sections,
  ].join("§");
}