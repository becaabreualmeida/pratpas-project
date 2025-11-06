import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  tipoPerfil: "idoso" | "cuidador" | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tipoPerfil, setTipoPerfil] = useState<"idoso" | "cuidador" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tipo_perfil')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setTipoPerfil(profile?.tipo_perfil || null);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setTipoPerfil(null);
    }
  };

  useEffect(() => {
    // Configurar listener primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Usar setTimeout para evitar deadlock
          setTimeout(() => {
            loadProfile(session.user.id);
          }, 0);
        } else {
          setTipoPerfil(null);
        }
      }
    );

    // Então verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadProfile(session.user.id).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTipoPerfil(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, tipoPerfil, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};