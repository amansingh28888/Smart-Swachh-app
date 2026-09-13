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
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // Auto-create profile if missing (e.g. initial Google OAuth login)
      if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const u = userData?.user;
          if (u) {
            const name =
              u.user_metadata?.full_name ||
              u.user_metadata?.name ||
              u.email?.split("@")[0] ||
              "User";
            const pendingRole = localStorage.getItem("pending_role");
            const role = pendingRole || u.user_metadata?.role || "citizen";
            if (pendingRole) {
              localStorage.removeItem("pending_role");
            }

            const newProfile = {
              id: u.id,
              name: name,
              email: u.email || "",
              role: role,
              points: 0,
            };
            const { data: createdProfile, error: insertError } = await supabase
              .from("profiles")
              .insert([newProfile])
              .select()
              .single();

            if (!insertError && createdProfile) {
              setProfile(createdProfile);
              return createdProfile;
            }
          }
        } catch (err) {
          console.error("Auto profile creation failed:", err);
        }
      }
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
      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }

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

    if (!supabase) return;

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
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  // SIGN UP
  async function signUp({ email, password, name, role }) {
    if (!supabase) throw new Error("Supabase client is not configured.");
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

  // SIGN IN WITH EMAIL/PASSWORD
  async function signIn({ email, password }) {
    if (!supabase) throw new Error("Supabase client is not configured.");
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

  // SIGN IN WITH GOOGLE ID TOKEN
  async function signInWithGoogleToken(idToken, meta = {}) {
    if (!supabase) {
      throw new Error(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    }
    
    if (meta.role) {
      localStorage.setItem("pending_role", meta.role);
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) throw error;
    
    if (data.session) {
      await loadProfile(data.session.user.id);
    }

    return data;
  }

  // SIGN OUT
  async function signOut() {
    if (!supabase) return;
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
        signInWithGoogleToken,
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