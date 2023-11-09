import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { DEFAULT_API_HOST, StoreKey } from "../constant";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import {
  firebaseListenerSetup,
  firebaseListenerTeardown,
} from "../firebase-helper";

const DEFAULT_OPENAI_URL =
  getClientConfig()?.buildMode === "export" ? DEFAULT_API_HOST : "/api/openai/";
console.log("[API] default openai url", DEFAULT_OPENAI_URL);

const DEFAULT_ACCESS_STATE = {
  email: "",
  password: "",
  needCode: true,
  hideUserApiKey: false,
  hideBalanceQuery: false,
  uid: "",
  openaiUrl: DEFAULT_OPENAI_URL,
};

export const userAuthStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    async signInWithFirebase(email: string, password: string) {
      try {
        let auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);
        auth = getAuth();
        if (!!auth.currentUser && !!auth.currentUser.uid) {
          set(() => ({ uid: auth.currentUser?.uid }));
        }
        firebaseListenerSetup();

        console.log(
          "[Auth] user sign in with Firebase successfully, email: ",
          get().email,
        );
        // User signed in successfully
      } catch (error) {
        console.error("[Auth] Failed to sign in with Firebase, email: ", email);
        throw error;
      }
    },

    async signOutFromFirebase() {
      try {
        const auth = getAuth();
        await signOut(auth);
        firebaseListenerTeardown();

        // User signed out successfully
        set(() => ({ email: "", password: "", uid: "" }));
        console.log("[Auth] Signed out successfully, email: ", get().email);
        // Clear local state if necessary
        set({ ...DEFAULT_ACCESS_STATE });
      } catch (error) {
        console.error("[Auth] Failed to sign out from Firebase");
        throw error;
      }
    },

    enabledAccessControl() {
      return get().needCode;
    },
    updateEmail(email: string) {
      set(() => ({ email: email?.trim() }));
    },
    updatePassword(password: string) {
      set(() => ({ password: password?.trim() }));
    },

    isAuthorized() {
      const auth = getAuth();
      const isFirebaseUserSignedIn = auth.currentUser != null;
      //   console.log(auth, auth.currentUser, isFirebaseUserSignedIn)
      return isFirebaseUserSignedIn;
    },
  }),
  {
    name: StoreKey.Access,
    version: 1,
  },
);
