import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Users, Trash2, UserPlus, Loader2 } from "lucide-react";
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
  const [emailCuidador, setEmailCuidador] = useState("");
  const [adicionando, setAdicionando] = useState(false);
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

  const handleAdicionarCuidador = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !emailCuidador.trim()) {
      toast.error("Por favor, digite um email válido");
      return;
    }

    setAdicionando(true);

    try {
      // Buscar o usuário cuidador pelo email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, tipo_perfil')
        .eq('email', emailCuidador.trim())
        .single();

      if (profileError || !profileData) {
        toast.error("Usuário não encontrado com este email");
        setAdicionando(false);
        return;
      }

      if (profileData.tipo_perfil !== 'cuidador') {
        toast.error("Este usuário não está cadastrado como cuidador");
        setAdicionando(false);
        return;
      }

      // Criar o relacionamento
      const { error: insertError } = await supabase
        .from('relacionamento_cuidador')
        .insert({
          idoso_id: user.id,
          cuidador_id: profileData.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          toast.error("Este cuidador já está vinculado");
        } else {
          throw insertError;
        }
      } else {
        toast.success("Cuidador adicionado com sucesso!");
        setEmailCuidador("");
        await carregarCuidadores(user.id);
      }
    } catch (error: any) {
      toast.error("Erro ao adicionar cuidador");
      console.error("Erro:", error.message);
    } finally {
      setAdicionando(false);
    }
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
        {/* Formulário para adicionar cuidador */}
        <Card className="shadow-[var(--shadow-medium)] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Adicionar Cuidador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdicionarCuidador} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">Email do Cuidador</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@cuidador.com"
                  value={emailCuidador}
                  onChange={(e) => setEmailCuidador(e.target.value)}
                  required
                  className="h-12 text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Digite o email de uma pessoa cadastrada como cuidador
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={adicionando}
              >
                {adicionando ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" />
                    Adicionar Cuidador
                  </>
                )}
              </Button>
            </form>
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
