import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

let initialized = false;

function getServiceAccountPath(): string {
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  const resolved = envPath
    ? path.resolve(process.cwd(), envPath)
    : path.resolve(process.cwd(), "serviceAccountKey.json");

  if (!fs.existsSync(resolved)) {
    throw new Error(`Missing Firebase service account file at: ${resolved}`);
  }

  return resolved;
}

export function ensureFirebaseAdminInitialized(): void {
  if (initialized) {
    return;
  }

  const serviceAccountPath = getServiceAccountPath();
  const serviceAccountJson = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8"),
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson),
  });

  initialized = true;
}

export async function ensureCreatorAccessByEmail(
  email: string,
): Promise<string> {
  ensureFirebaseAdminInitialized();

  const userRecord = await admin.auth().getUserByEmail(email);
  const userRef = admin.firestore().collection("users").doc(userRecord.uid);
  const snapshot = await userRef.get();

  const baseData = {
    uid: userRecord.uid,
    email: userRecord.email,
    role: "creator",
    isActive: true,
    needsRoleSelection: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!snapshot.exists) {
    await userRef.set({
      ...baseData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: Boolean(userRecord.emailVerified),
    });
  } else {
    await userRef.set(baseData, { merge: true });
  }

  return userRecord.uid;
}

export async function ensureCategoryExists(name: string): Promise<void> {
  ensureFirebaseAdminInitialized();

  const categoryRef = admin
    .firestore()
    .collection("categories")
    .doc(name.toLowerCase().replace(/\s+/g, "-"));
  const snapshot = await categoryRef.get();

  if (!snapshot.exists) {
    await categoryRef.set({
      name,
      description: `Auto-created category for automation: ${name}`,
      icon: "📚",
      color: "blue",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

export async function findQuizByTitleAndCreator(
  title: string,
  creatorUid: string,
  startAt: Date,
): Promise<FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData> | null> {
  ensureFirebaseAdminInitialized();

  const querySnapshot = await admin
    .firestore()
    .collection("quizzes")
    .where("title", "==", title)
    .where("createdBy", "==", creatorUid)
    .get();

  const candidate = querySnapshot.docs.find((doc) => {
    const createdAt = doc.get("createdAt");
    if (!createdAt || typeof createdAt.toDate !== "function") {
      return true;
    }
    return createdAt.toDate() >= startAt;
  });

  return candidate || null;
}

export async function deleteQuizById(quizId: string): Promise<void> {
  ensureFirebaseAdminInitialized();
  await admin.firestore().collection("quizzes").doc(quizId).delete();
}
