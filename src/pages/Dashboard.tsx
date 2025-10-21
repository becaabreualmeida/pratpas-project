import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, LogOut, Clock, Pill, User as UserIcon, Users, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ConfirmarTomada from "@/components/ConfirmarTomada";
import type { User } from "@supabase/supabase-js";

interface Medicamento {
  id: string;
  nome_medicamento: string;
  dosagem: string;
  horario_inicio: string;
  frequencia_numero: number;
  frequencia_unidade: string;
}

interface ProximaDose {
  registroId: string;
  medicamento: Medicamento;
  horario: string;
  data: string;
}

interface DosesPorDia {
  [data: string]: ProximaDose[];
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dosesPorDia, setDosesPorDia] = useState<DosesPorDia>({});
  const [modalAberto, setModalAberto] = useState(false);
  const [doseAtual, setDoseAtual] = useState<ProximaDose | null>(null);
  const navigate = useNavigate();

  const coresCards = [
    'bg-[hsl(var(--dose-card-1))]',
    'bg-[hsl(var(--dose-card-2))]',
    'bg-[hsl(var(--dose-card-3))]',
    'bg-[hsl(var(--dose-card-4))]',
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await carregarMedicamentos(session.user.id);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        carregarMedicamentos(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const carregarMedicamentos = async (userId: string) => {
    try {
      const agora = new Date().toISOString();
      const { data: registrosPendentes, error } = await supabase
        .from('registros_tomada')
        .select(`
          id,
          data_hora_prevista,
          medicamentos (
            id,
            nome_medicamento,
            dosagem,
            horario_inicio,
            frequencia_numero,
            frequencia_unidade
          )
        `)
        .eq('usuario_id', userId)
        .eq('status', 'Pendente')
        .gte('data_hora_prevista', agora)
        .order('data_hora_prevista', { ascending: true })
        .limit(20);

      if (error) throw error;

      if (registrosPendentes) {
        const doses: ProximaDose[] = registrosPendentes.map((reg: any) => ({
          registroId: reg.id,
          medicamento: reg.medicamentos,
          horario: new Date(reg.data_hora_prevista).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          data: new Date(reg.data_hora_prevista).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          }),
        }));

        // Agrupar doses por dia
        const grouped = doses.reduce((acc: DosesPorDia, dose) => {
          if (!acc[dose.data]) {
            acc[dose.data] = [];
          }
          acc[dose.data].push(dose);
          return acc;
        }, {});

        setDosesPorDia(grouped);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar medicamentos");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da sua conta");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Pill className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-[var(--shadow-soft)] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Pill className="w-10 h-10 text-primary" />
            <h1 className="text-2xl font-bold">MediLembre</h1>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg">
                  <Settings className="w-5 h-5 mr-2" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/editar-perfil")} className="text-lg py-3">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/cuidadores")} className="text-lg py-3">
                  <Users className="w-5 h-5 mr-2" />
                  Gerenciar Cuidadores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-lg py-3">
                  <LogOut className="w-5 h-5 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Próximas Doses</h2>
          
          {Object.keys(dosesPorDia).length === 0 ? (
            <Card className="p-12 text-center">
              <Pill className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-2xl font-semibold mb-2">Nenhum medicamento cadastrado</h3>
              <p className="text-xl text-muted-foreground mb-6">
                Clique no botão abaixo para adicionar seu primeiro remédio
              </p>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(dosesPorDia).map(([data, doses]) => (
                <div key={data} className="space-y-4">
                  <h3 className="text-2xl font-bold text-primary">{data}</h3>
                  <div className="space-y-4">
                    {doses.map((dose, index) => (
                      <Card
                        key={`${dose.medicamento.id}-${dose.horario}`}
                        className={`p-6 ${coresCards[index % coresCards.length]} border-0 transition-all hover:shadow-[var(--shadow-medium)] hover:scale-[1.02] cursor-pointer`}
                        onClick={() => {
                          setDoseAtual(dose);
                          setModalAberto(true);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-white/80 rounded-full p-4">
                            <Clock className="w-8 h-8 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-3 mb-2">
                              <span className="text-4xl font-bold text-foreground">
                                {dose.horario}
                              </span>
                            </div>
                            <h3 className="text-2xl font-semibold text-foreground mb-1">
                              {dose.medicamento.nome_medicamento}
                            </h3>
                            <p className="text-xl text-foreground/80">
                              {dose.medicamento.dosagem}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          size="lg"
          className="w-full h-16 text-xl font-semibold shadow-[var(--shadow-medium)]"
          onClick={() => navigate("/novo-medicamento")}
        >
          <Plus className="w-6 h-6 mr-2" />
          Registrar Novo Medicamento
        </Button>
      </main>

      {doseAtual && (
        <ConfirmarTomada
          open={modalAberto}
          onOpenChange={setModalAberto}
          registroId={doseAtual.registroId}
          medicamentoId={doseAtual.medicamento.id}
          nomeMedicamento={doseAtual.medicamento.nome_medicamento}
          dosagem={doseAtual.medicamento.dosagem}
          onConfirmar={() => {
            if (user) {
              carregarMedicamentos(user.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;