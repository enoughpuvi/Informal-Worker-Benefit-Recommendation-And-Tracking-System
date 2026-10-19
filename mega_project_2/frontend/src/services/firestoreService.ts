import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { db, isFirestoreAvailable } from '../config/firebase';
import { TrustedPortal, PortalScheme } from '../types';
import { INITIAL_TRUSTED_PORTALS, INITIAL_PORTAL_SCHEMES } from '../data/trustedPortalsData';

const PORTALS_COLLECTION = 'trusted_portals';
const SCHEMES_COLLECTION = 'portal_schemes';
const LOCAL_STORAGE_PORTALS_KEY = 'apana_trusted_portals_v1';
const LOCAL_STORAGE_SCHEMES_KEY = 'apana_portal_schemes_v1';

/**
 * Helper to get local persisted fallback data
 */
function getLocalPortals(): TrustedPortal[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PORTALS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn('[FirestoreService] Local storage read error:', err);
  }
  return INITIAL_TRUSTED_PORTALS;
}

function saveLocalPortals(portals: TrustedPortal[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PORTALS_KEY, JSON.stringify(portals));
  } catch (err) {
    console.warn('[FirestoreService] Local storage write error:', err);
  }
}

function getLocalSchemes(): PortalScheme[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SCHEMES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.warn('[FirestoreService] Local storage read error:', err);
  }
  return INITIAL_PORTAL_SCHEMES;
}

function saveLocalSchemes(schemes: PortalScheme[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SCHEMES_KEY, JSON.stringify(schemes));
  } catch (err) {
    console.warn('[FirestoreService] Local storage write error:', err);
  }
}

export const firestoreService = {
  /**
   * Initialize and seed Firestore if online and empty
   */
  async initializeFirestore(): Promise<void> {
    if (!db || !isFirestoreAvailable) return;
    try {
      const snap = await getDocs(collection(db, PORTALS_COLLECTION));
      if (snap.empty) {
        // Seed portals
        for (const portal of INITIAL_TRUSTED_PORTALS) {
          await setDoc(doc(db, PORTALS_COLLECTION, portal.id), portal);
        }
        // Seed schemes
        for (const scheme of INITIAL_PORTAL_SCHEMES) {
          await setDoc(doc(db, SCHEMES_COLLECTION, scheme.id), scheme);
        }
        console.log('[Firestore] Successfully seeded initial government portals and schemes.');
      }
    } catch (err) {
      console.warn('[Firestore] Seed check operating in fallback mode:', err);
      // Never throw - the page will use hardcoded fallback data
    }
  },

  /**
   * Fetch all trusted portals with optional query filtering
   */
  async getPortals(filters?: {
    level?: 'Central' | 'State' | 'All';
    state?: string;
    category?: string;
    search?: string;
    verification_status?: string;
  }): Promise<TrustedPortal[]> {
    let portals: TrustedPortal[] = [];

    // Attempt live Firestore read
    if (db && isFirestoreAvailable) {
      try {
        const queryConstraints: any[] = [];
        if (filters?.level && filters.level !== 'All') {
          queryConstraints.push(where('government_level', '==', filters.level));
        }
        const q = queryConstraints.length > 0
          ? query(collection(db, PORTALS_COLLECTION), ...queryConstraints)
          : collection(db, PORTALS_COLLECTION);

        const snap = await getDocs(q);
        if (!snap.empty) {
          portals = snap.docs.map(d => d.data() as TrustedPortal);
        }
      } catch (err) {
        console.warn('[Firestore] Using resilient local store for portals:', err);
        portals = getLocalPortals();
      }
    }

    if (portals.length === 0) {
      portals = getLocalPortals();
    }

    // Apply client-side filters
    if (filters) {
      if (filters.level && filters.level !== 'All') {
        portals = portals.filter(p => p.government_level === filters.level);
      }
      if (filters.state && filters.state !== 'All' && filters.state !== 'All India') {
        portals = portals.filter(p => p.state === filters.state || p.state === 'All India');
      }
      if (filters.category && filters.category !== 'All') {
        portals = portals.filter(p => p.categories.includes(filters.category as any));
      }
      if (filters.verification_status && filters.verification_status !== 'All') {
        portals = portals.filter(p => p.verification_status === filters.verification_status);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase().trim();
        portals = portals.filter(p =>
          p.name.toLowerCase().includes(s) ||
          (p.hindi_name && p.hindi_name.toLowerCase().includes(s)) ||
          p.description.toLowerCase().includes(s) ||
          p.responsible_department.toLowerCase().includes(s) ||
          p.categories.some(c => c.toLowerCase().includes(s)) ||
          p.supported_languages.some(l => l.toLowerCase().includes(s))
        );
      }
    }

    return portals;
  },

  /**
   * Retrieve a specific portal by ID
   */
  async getPortalById(id: string): Promise<TrustedPortal | null> {
    if (db && isFirestoreAvailable) {
      try {
        const snap = await getDoc(doc(db, PORTALS_COLLECTION, id));
        if (snap.exists()) {
          return snap.data() as TrustedPortal;
        }
      } catch (err) {
        console.warn('[Firestore] Error getting portal by ID, falling back:', err);
      }
    }
    const local = getLocalPortals().find(p => p.id === id);
    return local || null;
  },

  /**
   * Fetch scheme directory linked to portal records
   */
  async getPortalSchemes(filters?: {
    portal_id?: string;
    category?: string;
    state?: string;
    search?: string;
  }): Promise<PortalScheme[]> {
    let schemes: PortalScheme[] = [];

    if (db && isFirestoreAvailable) {
      try {
        const snap = await getDocs(collection(db, SCHEMES_COLLECTION));
        if (!snap.empty) {
          schemes = snap.docs.map(d => d.data() as PortalScheme);
        }
      } catch (err) {
        console.warn('[Firestore] Schemes query falling back to local store:', err);
        schemes = getLocalSchemes();
      }
    }

    if (schemes.length === 0) {
      schemes = getLocalSchemes();
    }

    if (filters) {
      if (filters.portal_id && filters.portal_id !== 'All') {
        schemes = schemes.filter(s => s.portal_id === filters.portal_id);
      }
      if (filters.category && filters.category !== 'All') {
        schemes = schemes.filter(s => s.category === filters.category);
      }
      if (filters.state && filters.state !== 'All' && filters.state !== 'All India') {
        schemes = schemes.filter(s => s.state_applicability === filters.state || s.state_applicability === 'All India');
      }
      if (filters.search) {
        const s = filters.search.toLowerCase().trim();
        schemes = schemes.filter(sch =>
          sch.name.toLowerCase().includes(s) ||
          sch.responsible_department.toLowerCase().includes(s) ||
          sch.target_occupation.toLowerCase().includes(s) ||
          sch.benefits.toLowerCase().includes(s) ||
          sch.eligibility.toLowerCase().includes(s)
        );
      }
    }

    return schemes;
  },

  /**
   * Record periodic link review & verification audit
   */
  async recordVerificationReview(
    portalId: string,
    verifiedStatus: 'Verified' | 'Needs verification' = 'Verified',
    reviewNotes?: string
  ): Promise<TrustedPortal> {
    const today = new Date().toISOString().split('T')[0];
    const portals = getLocalPortals();
    const index = portals.findIndex(p => p.id === portalId);
    let updatedPortal: TrustedPortal;

    if (index !== -1) {
      portals[index] = {
        ...portals[index],
        last_verified_date: today,
        verification_status: verifiedStatus,
        notes: reviewNotes || portals[index].notes
      };
      saveLocalPortals(portals);
      updatedPortal = portals[index];
    } else {
      throw new Error(`Portal ${portalId} not found.`);
    }

    if (db && isFirestoreAvailable) {
      try {
        const portalRef = doc(db, PORTALS_COLLECTION, portalId);
        await updateDoc(portalRef, {
          last_verified_date: today,
          verification_status: verifiedStatus,
          ...(reviewNotes ? { notes: reviewNotes } : {})
        });
      } catch (err) {
        console.warn('[Firestore] Could not sync review update to remote Firestore:', err);
      }
    }

    return updatedPortal;
  },

  /**
   * Alias for getPortalSchemes
   */
  async getSchemes(filters?: {
    portal_id?: string;
    category?: string;
    state?: string;
    search?: string;
  }): Promise<PortalScheme[]> {
    return this.getPortalSchemes(filters);
  }
};
