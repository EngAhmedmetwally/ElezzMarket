'use client';
    
import {
  set,
  push,
  update,
  remove,
  DatabaseReference,
} from 'firebase/database';

/**
 * Initiates a set operation for a database reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(dbRef: DatabaseReference, data: any) {
  set(dbRef, data).catch(error => {
    console.error("RTDB Set Error: ", error);
    // Not using the custom error emitter here as it was Firestore-specific.
    // A more robust RTDB error handler could be implemented.
  });
  // Execution continues immediately
}

/**
 * Initiates a push operation to generate a new key, followed by a set.
 * Does NOT await the write operation internally.
 * Returns the new reference, which can be used to get the key.
 */
export function addDocumentNonBlocking(colRef: DatabaseReference, data: any) {
  const newDocRef = push(colRef);
  set(newDocRef, data)
    .catch(error => {
      console.error("RTDB Add Error: ", error);
    });
  return newDocRef;
}

/**
 * Initiates an update operation for a database reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(dbRef: DatabaseReference, data: any) {
  update(dbRef, data)
    .catch(error => {
      console.error("RTDB Update Error: ", error);
    });
}

/**
 * Initiates a remove operation for a database reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(dbRef: DatabaseReference) {
  remove(dbRef)
    .catch(error => {
       console.error("RTDB Delete Error: ", error);
    });
}
