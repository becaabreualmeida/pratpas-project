import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Pill, Heart, Clock, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center bg-primary/10 p-6 rounded-full mb-6">
            <Pill className="w-20 h-20 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4">MediLembre</h1>
          <p className="text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Seu companheiro confiável para nunca esquecer seus medicamentos
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              className="h-16 px-8 text-xl font-semibold shadow-[var(--shadow-medium)]"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lembretes no Horário</h3>
            <p className="text-lg text-muted-foreground">
              Receba notificações precisas para cada medicamento
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fácil de Usar</h3>
            <p className="text-lg text-muted-foreground">
              Interface simples e clara, pensada para você
            </p>
          </div>

          <div className="text-center p-6">
            <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Seguro e Confiável</h3>
            <p className="text-lg text-muted-foreground">
              Seus dados protegidos com toda segurança
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
