import { useEffect, useState, useRef } from "react"; // Added useRef
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, LogOut, Clock, Pill, User as UserIcon, Users, Settings, Edit, ShoppingBag, BellRing, Check, X } from "lucide-react"; // Added BellRing, Check, X
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// Removida a importação não utilizada do ConfirmarTomada se a confirmação for apenas pelo toast
// import ConfirmarTomada from "@/components/ConfirmarTomada"; 
import type { User } from "@supabase/supabase-js";

interface Medicamento {
  id: string;
  nome_medicamento: string;
  dosagem: string;
  horario_inicio: string; // Assuming these exist from previous prompts
  frequencia_numero: number;
  frequencia_unidade: string;
  data_reposicao?: string; // Optional data field
  quantidade_atual?: number; // Optional data field
  limite_reabastecimento?: number; // Optional data field
}

interface ProximaDose {
  registroId: string;
  medicamento: Medicamento;
  horario: string; // HH:mm format for local time
  data: string; // Formatted date string for local time
}

interface DosesPorDia {
  [data: string]: ProximaDose[];
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dosesPorDia, setDosesPorDia] = useState<DosesPorDia>({});
  // Removido state não utilizado se o modal foi removido
  // const [modalAberto, setModalAberto] = useState(false); 
  // const [doseAtual, setDoseAtual] = useState<ProximaDose | null>(null); 
  const [medicamentosReposicao, setMedicamentosReposicao] = useState<any[]>([]);
  const navigate = useNavigate();

  // Ref para controlar quais notificações via toast já foram enviadas para não repetir
  const notifiedTimes = useRef(new Set());

  const coresCards = [
    'bg-[hsl(var(--dose-card-1))]',
    'bg-[hsl(var(--dose-card-2))]',
    'bg-[hsl(var(--dose-card-3))]',
    'bg-[hsl(var(--dose-card-4))]',
  ];

  useEffect(() => {
    // ... checkAuth logic remains the same ...
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
      } else if (session?.user) { // Check if session user exists
        setUser(session.user);
        carregarMedicamentos(session.user.id); // Reload data on auth change
      } else {
        setUser(null); // Clear user if session becomes invalid
        setDosesPorDia({});
        setMedicamentosReposicao([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Função para confirmar a tomada do medicamento (Chamada pelo toast)
  const handleConfirmarTomada = async (registroId: string | null, notificationKey: string) => { // Changed horario to notificationKey
    if (!registroId) {
      toast.error("Erro: Não foi possível identificar a dose para confirmar.");
      console.error("Tentativa de confirmar dose sem registroId:", notificationKey);
      return;
    }
    try {
      const { error } = await supabase
        .from('registros_tomada')
        .update({ status: 'Tomado', data_hora_realizada: new Date().toISOString() })
        .eq('id', registroId);

      if (error) throw error;

      toast.success("Medicamento confirmado!");
      notifiedTimes.current.add(notificationKey); // Mark as handled for today using the unique key
      // Recarrega os dados para atualizar a UI
      if (user) await carregarMedicamentos(user.id);

    } catch (error: any) {
      toast.error("Erro ao confirmar a tomada.");
      console.error("Erro Supabase:", error.message);
    }
  };

  // Função para pular a tomada do medicamento (Chamada pelo toast)
  const handlePularTomada = async (registroId: string | null, notificationKey: string) => { // Changed horario to notificationKey
    if (!registroId) {
      toast.error("Erro: Não foi possível identificar a dose para pular.");
      console.error("Tentativa de pular dose sem registroId:", notificationKey);
      return;
    }
    try {
      const { error } = await supabase
        .from('registros_tomada')
        .update({ status: 'Pulado' }) // Ou 'Não Tomado'
        .eq('id', registroId);

      if (error) throw error;

      toast.warning("Dose pulada.");
      notifiedTimes.current.add(notificationKey); // Mark as handled for today using the unique key
      // Recarrega os dados para atualizar a UI
      if (user) await carregarMedicamentos(user.id);

    } catch (error: any) {
      toast.error("Erro ao pular a dose.");
      console.error("Erro Supabase:", error.message);
    }
  };

  // --- INÍCIO: Lógica de Notificação via Toast ---
  useEffect(() => {
    // Só inicia o intervalo se o usuário estiver carregado
    if (!user) return; 

    const notificationInterval = setInterval(() => {
      const agora = new Date();
      // Ajuste para obter a hora local formatada HH:mm (considerando São Paulo)
      const horaAtual = agora.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo' // Garante o fuso correto
      });
      // Obter a data local formatada da mesma forma que dose.data
      const hojeStrLocal = agora.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'America/Sao_Paulo'
      });


      // Limpa as notificações à meia-noite
      if (horaAtual === '00:00') {
          notifiedTimes.current.clear();
      }

      // Percorre todas as doses carregadas (de todos os dias futuros listados)
      Object.values(dosesPorDia).flat().forEach((dose) => {
          const notificationKey = `${dose.data}-${dose.horario}`; // Chave única por dose/dia
          
          // --- CORREÇÃO AQUI ---
          // Verifica se a DATA da dose é a mesma que a data atual E
          // se o HORÁRIO da dose é o mesmo que a hora atual E 
          // se ainda não foi notificado hoje
          if (dose.data === hojeStrLocal && dose.horario === horaAtual && !notifiedTimes.current.has(notificationKey)) {

              // Dispara a notificação (toast) com os botões
              toast(`Hora de tomar: ${dose.medicamento.nome_medicamento} - ${dose.medicamento.dosagem}`, {
                  duration: 60000, // Tempo para interagir
                  icon: <BellRing className="w-6 h-6 text-blue-500" />,
                  action: {
                      label: "Tomei",
                      onClick: () => {
                          handleConfirmarTomada(dose.registroId, notificationKey);
                          toast.dismiss(`dose-${dose.registroId}`); // Fecha o toast após ação
                      },
                  },
                  cancel: {
                      label: "Pular",
                      onClick: () => {
                          handlePularTomada(dose.registroId, notificationKey);
                          toast.dismiss(`dose-${dose.registroId}`); // Fecha o toast após ação
                      },
                  },
                  id: `dose-${dose.registroId}` // ID para poder fechar o toast
              });

              // Marca esta combinação de data e horário como notificada para hoje
              notifiedTimes.current.add(notificationKey);
          }
      });
    }, 60000); // Verifica a cada 60 segundos (1 minuto)

    // Limpa o intervalo quando o componente desmonta ou o usuário muda
    return () => clearInterval(notificationInterval); 
  }, [dosesPorDia, user]); // Re-executa se as doses ou o usuário mudarem
  // --- FIM: Lógica de Notificação via Toast ---

  const carregarMedicamentos = async (userId: string) => {
    try {
      const agora = new Date();
       const hojeStr = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'); // Formato YYYY-MM-DD para Supabase date


      // Carregar registros pendentes a partir da hora atual
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
            frequencia_unidade,
            data_reposicao,
            quantidade_atual,
            limite_reabastecimento
          )
        `)
        .eq('usuario_id', userId)
        .eq('status', 'Pendente')
        .gte('data_hora_prevista', agora.toISOString()) // Busca a partir de agora
        .order('data_hora_prevista', { ascending: true })
        .limit(20); // Limita o número de doses futuras exibidas

      if (error) {
        console.error("Erro ao buscar registros:", error); // Log detalhado do erro
        throw error;
      }


      const doses: ProximaDose[] = [];
      const medsReposicaoMap = new Map(); // Usar Map para evitar duplicatas de reposição

      if (registrosPendentes) {
        registrosPendentes.forEach((reg: any) => {
          // Check if reg.medicamentos exists and is not null
           if (reg.medicamentos && typeof reg.medicamentos === 'object') {
              const dataUTC = new Date(reg.data_hora_prevista);
              const dataLocalStr = dataUTC.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' });
              const horarioLocal = dataUTC.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'});

              doses.push({
                registroId: reg.id,
                medicamento: reg.medicamentos,
                horario: horarioLocal,
                data: dataLocalStr,
              });

              // Verifica reposição DENTRO do loop de registros para pegar os dados do medicamento
              // Comparar datas no formato YYYY-MM-DD
               const dataReposicao = reg.medicamentos.data_reposicao; // Assume YYYY-MM-DD
               if(dataReposicao === hojeStr && !medsReposicaoMap.has(reg.medicamentos.id)){
                   medsReposicaoMap.set(reg.medicamentos.id, reg.medicamentos);
               }
          } else {
             console.warn(`Registro ${reg.id} não possui dados de medicamento válidos ou a relação falhou.`);
          }
        });
      }

      // Agrupar doses por dia
      const grouped = doses.reduce((acc: DosesPorDia, dose) => {
        if (!acc[dose.data]) {
          acc[dose.data] = [];
        }
        acc[dose.data].push(dose);
        return acc;
      }, {});

      setDosesPorDia(grouped);
      setMedicamentosReposicao(Array.from(medsReposicaoMap.values())); // Atualiza os medicamentos para reposição

    } catch (error: any) {
      toast.error("Erro ao carregar dados do dashboard");
      console.error("Erro Supabase:", error.message);
    }
  };

  const handleLogout = async () => {
    // ... logout logic ...
    await supabase.auth.signOut();
    toast.success("Você saiu da sua conta");
    navigate("/auth"); // Redireciona para login após logout
  };

  if (loading) {
     // ... loading JSX ...
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
         {/* Header JSX */}
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
        {/* --- Card de Reposição --- */}
        {medicamentosReposicao.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 text-destructive">Alertas de Reposição</h2>
            <div className="space-y-4">
              {medicamentosReposicao.map((med) => (
                <Card
                  key={`repo-${med.id}`} // Add prefix to avoid key collision
                  className="p-6 bg-destructive/10 border-destructive border-2"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-destructive rounded-full p-4">
                      <ShoppingBag className="w-8 h-8 text-destructive-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">Repor Medicamento</h3>
                      <p className="text-xl">
                        Hoje é dia de comprar mais <span className="font-semibold">{med.nome_medicamento}</span>
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* --- Fim Card de Reposição --- */}

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6">Próximas Doses</h2>

          {Object.keys(dosesPorDia).length === 0 ? (
             // ... JSX para nenhum medicamento ...
             <Card className="p-12 text-center">
              <Pill className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-2xl font-semibold mb-2">Nenhuma próxima dose</h3>
              <p className="text-xl text-muted-foreground mb-6">
                Não há lembretes pendentes. Você pode registrar um novo medicamento abaixo.
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
                        // A key agora inclui registroId para ser mais única
                        key={`${dose.medicamento.id}-${dose.horario}-${dose.registroId}`}
                        className={`p-6 ${coresCards[index % coresCards.length]} border-0 transition-all hover:shadow-[var(--shadow-medium)] hover:scale-[1.02]`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-white/80 rounded-full p-4">
                            <Clock className="w-8 h-8 text-primary" />
                          </div>
                          {/* Área clicável removida, a interação será pelo toast ou edição */}
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
                          {/* Botão de Editar */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation(); // Evita ativar outros cliques
                              navigate(`/editar-medicamento/${dose.medicamento.id}`);
                            }}
                          >
                            <Edit className="w-6 h-6" />
                          </Button>
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

      {/* Commenting out the modal confirmation as it's now handled by the toast */}
      {/* {doseAtual && (
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
      )} */}
    </div>
  );
};

export default Dashboard;

