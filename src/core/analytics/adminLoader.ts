import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "./firebase";

import {
  decodePacket,
  DecodedPacket,
} from "./decoder";

import {
  aggregatePackets,
  AggregatedUser,
} from "./aggregate";

export async function loadAnalyticsUsers():
Promise<
  Record<
    string,
    AggregatedUser
  >
> {

  console.log(
    "[ADMIN] loading packets..."
  );

  console.log(
    "[ADMIN] firestore db:",
    db
  );

  try {

    // TEMP DEBUG
    console.log(
      "[ADMIN] querying collection: analyticsPackets"
    );

    const packetsRef =
      collection(
        db,
        "analyticsPackets"
      );

    console.log(
      "[ADMIN] packetsRef:",
      packetsRef
    );

    const q = query(
      packetsRef,
      orderBy(
        "createdAt",
        "desc"
      )
    );

    console.log(
      "[ADMIN] query created:",
      q
    );

    const snapshot =
      await getDocs(q);

    // =========================
    // TEMP DEBUG
    // =========================

    console.log(
      "[ADMIN] snapshot raw:",
      snapshot
    );

    console.log(
      "[ADMIN] docs:",
      snapshot.size
    );

    console.log(
      "[ADMIN] empty?:",
      snapshot.empty
    );

    const decoded:
      DecodedPacket[] = [];

    snapshot.forEach((docSnap) => {

      console.log(
        "[ADMIN DOC ID]",
        docSnap.id
      );

      const data =
        docSnap.data();

      console.log(
        "[ADMIN DOC DATA]",
        data
      );

      // TEMP:
      // inspect all keys
      console.log(
        "[ADMIN DOC KEYS]",
        Object.keys(data)
      );

      // packet missing
      if (
        typeof data.packet !==
        "string"
      ) {

        console.warn(
          "[ADMIN] skipped doc (no packet string):",
          docSnap.id
        );

        return;
      }

      console.log(
        "[ADMIN] decoding packet:",
        data.packet
      );

      const parsed =
        decodePacket(
          data.packet
        );

      console.log(
        "[ADMIN] parsed:",
        parsed
      );

      // invalid legacy packet
      if (!parsed) {

        console.warn(
          "[ADMIN] failed decode:",
          data.packet
        );

        return;
      }

      decoded.push(parsed);
    });

    console.log(
      "[ADMIN] decoded count:",
      decoded.length
    );

    const aggregated =
      aggregatePackets(
        decoded
      );

    console.log(
      "[ADMIN] aggregated:",
      aggregated
    );

    return aggregated;

  } catch (err) {

    console.error(
      "[ADMIN] fatal load error:",
      err
    );

    return {};
  }
}