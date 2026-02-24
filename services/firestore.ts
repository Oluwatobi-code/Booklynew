import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BusinessProfile, Order, Product, Customer, Expense } from '../types';

const INITIAL_PROFILE: BusinessProfile = {
    name: 'My Business',
    currency: 'NGN',
    phone: '',
    email: '',
    footerNote: 'Thank you for your patronage!',
    vipThreshold: 5
};

/** Shape of the user document stored in Firestore */
export interface UserDocument {
    email: string;
    createdAt: string;
    profile: BusinessProfile;
    orders: Order[];
    products: Product[];
    customers: Customer[];
    expenses: Expense[];
    settings: {
        showFab: boolean;
        soundEnabled: boolean;
    };
}

/**
 * Create a new user document in Firestore with default values.
 * Called once during sign-up.
 */
export const createUserDocument = async (uid: string, email: string): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    const defaultData: UserDocument = {
        email,
        createdAt: new Date().toISOString(),
        profile: INITIAL_PROFILE,
        orders: [],
        products: [],
        customers: [],
        expenses: [],
        settings: { showFab: true, soundEnabled: false }
    };
    await setDoc(userRef, defaultData);
};

/**
 * Fetch the full user document from Firestore.
 * Returns null if the document doesn't exist.
 */
export const getUserData = async (uid: string): Promise<UserDocument | null> => {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
        return snapshot.data() as UserDocument;
    }
    return null;
};

/**
 * Save the user's full app state to Firestore (merge to avoid overwriting fields).
 * Called whenever state changes (debounced in App.tsx).
 */
export const saveUserData = async (
    uid: string,
    data: Partial<UserDocument>
): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });
};
