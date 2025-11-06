import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const EditarPerfil = () => {
  const navigate = useNavigate();
  const { tipoPerfil } = useAuth();
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");
  const [alergias, setAlergias] = useState("");
  const [condicoesMedicas, setCondicoesMedicas] = useState("");

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setNome(profile.nome || "");
        setEmail(profile.email || "");
        setDataNascimento(profile.data_nascimento || "");
        setContatoEmergenciaNome(profile.contato_emergencia_nome || "");
        setContatoEmergenciaTelefone(profile.contato_emergencia_telefone || "");
        setAlergias(profile.alergias || "");
        setCondicoesMedicas(profile.condicoes_medicas || "");
      }
    } catch (error: any) {
      toast.error("Erro ao carregar perfil");
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nome,
          data_nascimento: dataNascimento || null,
          contato_emergencia_nome: contatoEmergenciaNome || null,
          contato_emergencia_telefone: contatoEmergenciaTelefone || null,
          alergias: alergias || null,
          condicoes_medicas: condicoesMedicas || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      // Redirecionar para o dashboard correto baseado no tipo de perfil
      if (tipoPerfil === "cuidador") {
        navigate("/pacientes-monitorados");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <User className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">Carregando perfil...</p>
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
            onClick={() => {
              // Voltar para o dashboard correto baseado no tipo de perfil
              if (tipoPerfil === "cuidador") {
                navigate("/pacientes-monitorados");
              } else {
                navigate("/dashboard");
              }
            }}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <Button
            className="ml-auto h-12 px-6 text-lg font-semibold"
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-[var(--shadow-medium)]">
          <CardHeader>
            <CardTitle className="text-2xl">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xl">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xl">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-14 text-lg bg-muted"
                />
                <p className="text-sm text-muted-foreground">O email não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-nascimento" className="text-xl">Data de Nascimento</Label>
                <Input
                  id="data-nascimento"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="h-14 text-lg"
                />
              </div>

              {tipoPerfil === "idoso" && (
                <>
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-semibold mb-4">Contato de Emergência</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contato-nome" className="text-xl">Nome</Label>
                        <Input
                          id="contato-nome"
                          type="text"
                          placeholder="Nome do contato"
                          value={contatoEmergenciaNome}
                          onChange={(e) => setContatoEmergenciaNome(e.target.value)}
                          className="h-14 text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contato-telefone" className="text-xl">Telefone</Label>
                        <Input
                          id="contato-telefone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={contatoEmergenciaTelefone}
                          onChange={(e) => setContatoEmergenciaTelefone(e.target.value)}
                          className="h-14 text-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-semibold mb-4">Informações de Saúde</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="alergias" className="text-xl">Alergias Conhecidas</Label>
                        <Textarea
                          id="alergias"
                          placeholder="Descreva suas alergias conhecidas..."
                          value={alergias}
                          onChange={(e) => setAlergias(e.target.value)}
                          className="min-h-24 text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="condicoes" className="text-xl">Condições Médicas</Label>
                        <Textarea
                          id="condicoes"
                          placeholder="Descreva suas condições médicas relevantes..."
                          value={condicoesMedicas}
                          onChange={(e) => setCondicoesMedicas(e.target.value)}
                          className="min-h-24 text-lg"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditarPerfil;
