import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react";

const Cuidadores = () => {
  const navigate = useNavigate();

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

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-[var(--shadow-medium)]">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center bg-primary/10 p-6 rounded-full mb-6">
              <Users className="w-20 h-20 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Gerenciamento de Cuidadores</h2>
            <p className="text-2xl text-muted-foreground">Em breve!</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Cuidadores;
