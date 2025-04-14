import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  deleteDoc,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Session {
  id: string;
  name: string;
  status: "active" | "completed" | "paused";
  createdAt: Timestamp;
  // Add other fields as needed
}

/**
 * Fetches all active sessions from the database
 */
export const getActiveSessions = async (): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, "sessions");

    // Make sure we're querying for sessions with status exactly equal to "active"
    const q = query(
      sessionsRef,
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    // Convert Firestore docs to Session objects
    return querySnapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unnamed Session",
          status: data.status || "active",
          createdAt: data.createdAt || Timestamp.now(),
          // Map any other fields needed
        } as Session;
      }
    );
  } catch (error) {
    console.error("Error getting active sessions:", error);
    return []; // Return empty array instead of throwing to prevent UI crashes
  }
};

/**
 * Fetches a specific session by ID
 */
export const getSessionById = async (
  sessionId: string
): Promise<Session | null> => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      return {
        id: sessionSnap.id,
        name: data.name || "Unnamed Session",
        status: data.status || "active",
        createdAt: data.createdAt || Timestamp.now(),
        // Map any other fields needed
      } as Session;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

/**
 * Deletes a session and associated data
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    // Start a batch write
    const batch = writeBatch(db);

    // Delete the session document
    const sessionRef = doc(db, "sessions", sessionId);
    batch.delete(sessionRef);

    // Delete associated team responses
    const responsesQuery = query(
      collection(db, "responses"),
      where("sessionId", "==", sessionId)
    );

    const responseSnapshot = await getDocs(responsesQuery);
    responseSnapshot.forEach((docSnapshot) => {
      batch.delete(doc(db, "responses", docSnapshot.id));
    });

    // Delete associated teams
    const teamsQuery = query(
      collection(db, "teams"),
      where("sessionId", "==", sessionId)
    );

    const teamsSnapshot = await getDocs(teamsQuery);
    teamsSnapshot.forEach((docSnapshot) => {
      batch.delete(doc(db, "teams", docSnapshot.id));
    });

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};
