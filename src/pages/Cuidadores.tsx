import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Users, Trash2, RefreshCw, Loader2, Copy, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { User } from "@supabase/supabase-js";

interface Cuidador {
  id: string;
  cuidador_id: string;
  nome: string;
  email: string;
}

const Cuidadores = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [codigoAtual, setCodigoAtual] = useState<string | null>(null);
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await carregarCuidadores(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        carregarCuidadores(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const carregarCuidadores = async (idosoId: string) => {
    try {
      const { data: relacionamentos, error } = await supabase
        .from('relacionamento_cuidador')
        .select(`
          id,
          cuidador_id,
          profiles!relacionamento_cuidador_cuidador_id_fkey (
            id,
            nome,
            email
          )
        `)
        .eq('idoso_id', idosoId);

      if (error) throw error;

      const cuidadoresList: Cuidador[] = relacionamentos?.map((rel: any) => ({
        id: rel.id,
        cuidador_id: rel.cuidador_id,
        nome: rel.profiles.nome,
        email: rel.profiles.email,
      })) || [];

      setCuidadores(cuidadoresList);
    } catch (error: any) {
      toast.error("Erro ao carregar cuidadores");
      console.error("Erro:", error.message);
    }
  };

  const handleAdicionarCuidador = async () => {
    if (!user) return;
    
    setGerandoCodigo(true);

    try {
      const { data, error } = await supabase.functions.invoke('gerar-codigo-convite', {
        body: {},
      });

      if (error) throw error;

      setCodigoAtual(data.codigo);
      
      // Calcular tempo restante (10 minutos em segundos)
      const dataExpiracao = new Date(data.data_expiracao);
      const agora = new Date();
      const diff = Math.floor((dataExpiracao.getTime() - agora.getTime()) / 1000);
      setTempoRestante(diff);

      toast.success("Código gerado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao gerar código");
      console.error("Erro:", error);
    } finally {
      setGerandoCodigo(false);
    }
  };

  // Atualizar o tempo restante a cada segundo
  useEffect(() => {
    if (tempoRestante <= 0) {
      setCodigoAtual(null);
      return;
    }

    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          setCodigoAtual(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tempoRestante]);

  const copiarCodigo = () => {
    if (codigoAtual) {
      navigator.clipboard.writeText(codigoAtual);
      toast.success("Código copiado!");
    }
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRemoverCuidador = async (relacionamentoId: string) => {
    try {
      const { error } = await supabase
        .from('relacionamento_cuidador')
        .delete()
        .eq('id', relacionamentoId);

      if (error) throw error;

      toast.success("Cuidador removido com sucesso!");
      if (user) await carregarCuidadores(user.id);
    } catch (error: any) {
      toast.error("Erro ao remover cuidador");
      console.error("Erro:", error.message);
    }
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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Gerenciar Cuidadores</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Formulário para gerar código */}
        <Card className="shadow-[var(--shadow-medium)] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Adicionar Cuidador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Gere um código de 5 dígitos para compartilhar com seu cuidador. 
                O código expira em 10 minutos.
              </p>
              
              {codigoAtual ? (
                <div className="space-y-4">
                  <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Seu código de convite:</p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-5xl font-bold tracking-wider text-primary">
                        {codigoAtual}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copiarCodigo}
                        className="h-12 w-12"
                      >
                        <Copy className="w-6 h-6" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Expira em: {formatarTempo(tempoRestante)}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleAdicionarCuidador}
                    variant="outline"
                    className="w-full h-12 text-lg"
                    disabled={gerandoCodigo}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Gerar Novo Código
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleAdicionarCuidador}
                  className="w-full h-12 text-lg"
                  disabled={gerandoCodigo}
                >
                  {gerandoCodigo ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Gerar Código de Convite
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de cuidadores */}
        <Card className="shadow-[var(--shadow-medium)]">
          <CardHeader>
            <CardTitle className="text-2xl">Meus Cuidadores</CardTitle>
          </CardHeader>
          <CardContent>
            {cuidadores.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">
                  Você ainda não tem cuidadores vinculados
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cuidadores.map((cuidador) => (
                  <div
                    key={cuidador.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-lg font-semibold">{cuidador.nome}</p>
                      <p className="text-sm text-muted-foreground">{cuidador.email}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Cuidador</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{cuidador.nome}</strong> da sua lista de cuidadores?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoverCuidador(cuidador.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Cuidadores;
