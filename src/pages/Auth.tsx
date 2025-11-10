import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Pill, Loader2 } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipoPerfil, setTipoPerfil] = useState<"idoso" | "cuidador">("idoso");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tipo_perfil')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.tipo_perfil === 'cuidador') {
          navigate("/pacientes-monitorados");
        } else {
          navigate("/dashboard");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tipo_perfil')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.tipo_perfil === 'cuidador') {
          navigate("/pacientes-monitorados");
        } else {
          navigate("/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Login realizado com sucesso!");
        }
      } else {
        if (!nome.trim()) {
          toast.error("Por favor, digite seu nome");
          setLoading(false);
          return;
        }

        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: {
              nome: nome,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (!error && authData.user) {
          // Atualizar o tipo de perfil no profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ tipo_perfil: tipoPerfil })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error("Erro ao atualizar perfil:", profileError);
          }
        }

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Cadastro realizado! Você já pode fazer login.");
        }
      }
    } catch (error: any) {
      toast.error("Erro ao processar sua solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-medium)]">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Pill className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">MediLembre</CardTitle>
          <CardDescription className="text-lg">
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-lg">Nome Completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required={!isLogin}
                    className="h-12 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-lg">Tipo de Perfil</Label>
                  <RadioGroup
                    value={tipoPerfil}
                    onValueChange={(value) => setTipoPerfil(value as "idoso" | "cuidador")}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="idoso" id="idoso" />
                      <Label htmlFor="idoso" className="text-lg cursor-pointer flex-1">
                        Sou Paciente (Idoso)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="cuidador" id="cuidador" />
                      <Label htmlFor="cuidador" className="text-lg cursor-pointer flex-1">
                        Sou Cuidador
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-lg">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="h-12 text-lg"
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-14 text-xl font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Processando...
                </>
              ) : (
                isLogin ? "Entrar" : "Cadastrar"
              )}
            </Button>
            {isLogin && (
              <Button
                type="button"
                variant="link"
                className="w-full text-lg"
                onClick={() => navigate("/recuperar-senha")}
              >
                Esqueci minha senha
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full h-12 text-lg"
              onClick={() => {
                setIsLogin(!isLogin);
                setNome("");
                setEmail("");
                setSenha("");
                setTipoPerfil("idoso");
              }}
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;