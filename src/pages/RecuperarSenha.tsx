import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error("Erro ao enviar e-mail de recuperação");
        console.error(error);
      } else {
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
        setTimeout(() => navigate("/auth"), 2000);
      }
    } catch (error: any) {
      toast.error("Erro ao processar solicitação");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-medium)]">
        <CardHeader className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="absolute top-4 left-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Mail className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Recuperar Senha</CardTitle>
          <CardDescription className="text-lg">
            Digite seu e-mail para receber instruções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRecuperacao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">E-mail</Label>
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
            <Button
              type="submit"
              className="w-full h-14 text-xl font-semibold"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecuperarSenha;