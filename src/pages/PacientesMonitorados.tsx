import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Users, User, LogOut, Eye, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Idoso {
  id: string;
  relacionamentoId: string;
  nome: string;
  email: string;
  adesaoHoje: {
    confirmadas: number;
    total: number;
  };
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
          id,
          idoso_id,
          profiles!relacionamento_cuidador_idoso_id_fkey (
            id,
            nome,
            email
          )
        `)
        .eq('cuidador_id', cuidadorId);

      if (error) throw error;

      // Para cada paciente, calcular a adesão de hoje
      const idososComAdesao = await Promise.all(
        (relacionamentos || []).map(async (rel: any) => {
          const hoje = new Date().toISOString().split('T')[0];
          
          // Buscar todas as doses de hoje
          const { data: dosesHoje } = await supabase
            .from('registros_tomada')
            .select('status')
            .eq('usuario_id', rel.profiles.id)
            .gte('data_hora_prevista', `${hoje}T00:00:00`)
            .lt('data_hora_prevista', `${hoje}T23:59:59`);

          const totalDoses = dosesHoje?.length || 0;
          const dosesConfirmadas = dosesHoje?.filter(d => d.status === 'Tomado').length || 0;

          return {
            id: rel.profiles.id,
            relacionamentoId: rel.id,
            nome: rel.profiles.nome,
            email: rel.profiles.email,
            adesaoHoje: { confirmadas: dosesConfirmadas, total: totalDoses },
          };
        })
      );

      setIdosos(idososComAdesao);
    } catch (error: any) {
      toast.error("Erro ao carregar pacientes");
      console.error("Erro:", error.message);
    }
  };

  const handleRemoverVinculo = async (relacionamentoId: string, nomePaciente: string) => {
    try {
      const { error } = await supabase
        .from('relacionamento_cuidador')
        .delete()
        .eq('id', relacionamentoId);

      if (error) throw error;

      toast.success(`Você parou de monitorar ${nomePaciente}`);
      if (user) await carregarIdosos(user.id);
    } catch (error: any) {
      toast.error("Erro ao remover vínculo");
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {idosos.map((idoso) => (
              <Card
                key={idoso.id}
                className="shadow-[var(--shadow-medium)] hover:shadow-[var(--shadow-large)] transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-primary/10 rounded-full p-4">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{idoso.nome}</h3>
                      <p className="text-base text-muted-foreground">{idoso.email}</p>
                    </div>
                  </div>

                  {/* Mini-Dashboard de Adesão */}
                  <div className="bg-accent/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Adesão Hoje</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {idoso.adesaoHoje.confirmadas}
                      </span>
                      <span className="text-xl text-muted-foreground">
                        / {idoso.adesaoHoje.total} doses confirmadas
                      </span>
                    </div>
                    {idoso.adesaoHoje.total > 0 && (
                      <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{
                            width: `${(idoso.adesaoHoje.confirmadas / idoso.adesaoHoje.total) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={() => navigate(`/gerenciamento-paciente/${idoso.id}`)}
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Gerenciar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="lg">
                          <X className="w-5 h-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Parar de Monitorar</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja parar de monitorar {idoso.nome}? Você não terá mais acesso aos dados deste paciente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoverVinculo(idoso.relacionamentoId, idoso.nome)}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
