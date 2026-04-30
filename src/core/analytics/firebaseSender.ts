import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export async function sendToFirebase(
  packet: string
): Promise<void> {

  if (!packet) {
    console.warn(
      "[FIREBASE] empty packet skipped"
    );
    return;
  }

  try {

    console.log(
      "[FIREBASE] attempting upload"
    );

    console.log(
      "[FIREBASE] packet:",
      packet
    );

    const docRef = await addDoc(
      collection(
        db,
        "analyticsPackets"
      ),
      {
        packet,
        createdAt:
          serverTimestamp(),
      }
    );

    console.log(
      "[FIREBASE] upload success:",
      docRef.id
    );

  } catch (err) {

    console.error(
      "[FIREBASE] upload failed:",
      err
    );

    throw err;
  }
}