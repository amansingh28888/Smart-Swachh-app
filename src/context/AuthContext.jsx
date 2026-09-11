import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from database
  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile load error:", error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }, []);

  // Check existing session + listen for auth changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);

      if (session) {
        await loadProfile(session.user.id);
      }

      setLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // SIGN UP
  async function signUp({ email, password, name, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          name: name,
          role: role,
        },
      },
    });

    if (error) throw error;

    if (data.session && data.user) {
      setSession(data.session);

      // Profile trigger automatically creates profile
      await loadProfile(data.user.id);

      return {
        needsEmailConfirm: false,
      };
    }

    return {
      needsEmailConfirm: true,
    };
  }

  // SIGN IN
  async function signIn({ email, password }) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    setSession(data.session);

    const userProfile = await loadProfile(
      data.session.user.id
    );

    if (!userProfile) {
      throw new Error(
        "Signed in, but no profile found for this account."
      );
    }

    return userProfile;
  }

  // SIGN OUT
  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setSession(null);
    setProfile(null);
  }

  // Reload current user's profile
  async function reloadProfile() {
    if (!session?.user?.id) return null;

    return await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        setProfile,
        loading,
        signUp,
        signIn,
        signOut,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}