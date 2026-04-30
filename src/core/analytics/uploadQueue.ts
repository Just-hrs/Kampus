import {
  idbGet,
  idbSet,
} from "@/core/storage/db";

const QUEUE_KEY =
  "analytics_upload_queue";

export async function getAnalyticsQueue(): Promise<
  string[]
> {

  const existing =
    await idbGet<string[]>(
      "meta",
      QUEUE_KEY
    );

  console.log(
    "[QUEUE] current queue:",
    existing
  );

  return existing ?? [];
}

export async function enqueueAnalytics(
  packet: string
) {

  console.log(
    "[QUEUE] enqueue packet:",
    packet
  );

  const queue =
    await getAnalyticsQueue();

  queue.push(packet);

  await idbSet(
    "meta",
    QUEUE_KEY,
    queue
  );

  console.log(
    "[QUEUE] queue after enqueue:",
    queue
  );
}

export async function flushAnalyticsQueue(
  sender: (
    packet: string
  ) => Promise<void>
): Promise<string[]> {

  console.log(
    "[QUEUE] flush started"
  );

  const queue =
    await idbGet<string[]>(
      "meta",
      QUEUE_KEY
    );

  console.log(
    "[QUEUE] loaded queue:",
    queue
  );

  if (!queue?.length) {

    console.log(
      "[QUEUE] nothing to upload"
    );

    return [];
  }

  const remaining: string[] = [];

  const uploaded: string[] = [];

  for (const packet of queue) {

    console.log(
      "[QUEUE] uploading:",
      packet
    );

    try {

      await sender(packet);

      uploaded.push(packet);

      console.log(
        "[QUEUE] upload success"
      );

    } catch (err) {

      console.error(
        "[QUEUE] upload failed:",
        err
      );

      remaining.push(packet);
    }
  }

  await idbSet(
    "meta",
    QUEUE_KEY,
    remaining
  );

  console.log(
    "[QUEUE] remaining packets:",
    remaining
  );

  return uploaded;
}

export async function debugSendNow(
  packet: string,
  sender: (
    packet: string
  ) => Promise<void>
) {

  console.log(
    "[QUEUE] debug send now:",
    packet
  );

  await sender(packet);
}