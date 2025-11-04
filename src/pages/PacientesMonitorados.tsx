import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Users, User, LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Idoso {
  id: string;
  nome: string;
  email: string;
}

const PacientesMonitorados = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await carregarIdosos(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        carregarIdosos(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const carregarIdosos = async (cuidadorId: string) => {
    try {
      const { data: relacionamentos, error } = await supabase
        .from('relacionamento_cuidador')
        .select(`
          idoso_id,
          profiles!relacionamento_cuidador_idoso_id_fkey (
            id,
            nome,
            email
          )
        `)
        .eq('cuidador_id', cuidadorId);

      if (error) throw error;

      const idososList: Idoso[] = relacionamentos?.map((rel: any) => ({
        id: rel.profiles.id,
        nome: rel.profiles.nome,
        email: rel.profiles.email,
      })) || [];

      setIdosos(idososList);
    } catch (error: any) {
      toast.error("Erro ao carregar pacientes");
      console.error("Erro:", error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da sua conta");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Users className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-[var(--shadow-soft)] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pacientes Monitorados</h1>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Meus Pacientes</h2>
          <p className="text-muted-foreground">
            Selecione um paciente para ver o histórico de medicação
          </p>
        </div>

        {idosos.length === 0 ? (
          <Card className="shadow-[var(--shadow-medium)]">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center bg-primary/10 p-6 rounded-full mb-6">
                <Users className="w-20 h-20 text-primary" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Nenhum paciente vinculado</h3>
              <p className="text-2xl text-muted-foreground">
                Aguarde um paciente adicionar você como cuidador
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {idosos.map((idoso) => (
              <Card
                key={idoso.id}
                className="shadow-[var(--shadow-medium)] hover:shadow-[var(--shadow-large)] transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => navigate(`/historico-paciente/${idoso.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-full p-4">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{idoso.nome}</h3>
                      <p className="text-sm text-muted-foreground">{idoso.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PacientesMonitorados;
