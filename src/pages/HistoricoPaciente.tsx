import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Clock, CheckCircle, XCircle, MinusCircle, User, Plus, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Profile {
  nome: string;
  email: string;
  alergias?: string;
}

interface RegistroTomada {
  id: string;
  data_hora_prevista: string;
  data_hora_realizada: string | null;
  status: string;
  medicamentos: {
    nome_medicamento: string;
    dosagem: string;
  };
}

interface RegistroPorDia {
  [data: string]: RegistroTomada[];
}

const HistoricoPaciente = () => {
  const { usuarioId } = useParams<{ usuarioId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [registros, setRegistros] = useState<RegistroPorDia>({});
  const [filtro, setFiltro] = useState<"dia" | "semana" | "mes">("semana");
  const [adesao, setAdesao] = useState<number>(0);
  const [isCuidador, setIsCuidador] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (usuarioId) {
      verificarPerfilECarregarDados();
    }
  }, [usuarioId, filtro]);

  const verificarPerfilECarregarDados = async () => {
    try {
      // Verificar se é o próprio usuário ou se é cuidador vendo paciente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('tipo_perfil')
        .eq('id', user.id)
        .single();

      setIsCuidador(currentProfile?.tipo_perfil === 'cuidador' && user.id !== usuarioId);
      
      await carregarDados();
    } catch (error) {
      console.error('Erro ao verificar perfil:', error);
      navigate('/dashboard');
    }
  };

  const carregarDados = async () => {
    try {
      // Carregar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nome, email, alergias')
        .eq('id', usuarioId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Calcular data de início baseada no filtro
      const agora = new Date();
      const dataInicio = new Date();
      
      if (filtro === "dia") {
        dataInicio.setHours(0, 0, 0, 0);
      } else if (filtro === "semana") {
        dataInicio.setDate(agora.getDate() - 7);
      } else if (filtro === "mes") {
        dataInicio.setDate(agora.getDate() - 30);
      }

      // Carregar registros de tomada
      const { data: registrosData, error: registrosError } = await supabase
        .from('registros_tomada')
        .select(`
          id,
          data_hora_prevista,
          data_hora_realizada,
          status,
          medicamentos (
            nome_medicamento,
            dosagem
          )
        `)
        .eq('usuario_id', usuarioId)
        .gte('data_hora_prevista', dataInicio.toISOString())
        .lte('data_hora_prevista', agora.toISOString())
        .order('data_hora_prevista', { ascending: false });

      if (registrosError) throw registrosError;

      // Agrupar registros por dia
      const grouped: RegistroPorDia = {};
      registrosData?.forEach((reg: any) => {
        if (reg.medicamentos) {
          const dataUTC = new Date(reg.data_hora_prevista);
          const dataLocal = dataUTC.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });

          if (!grouped[dataLocal]) {
            grouped[dataLocal] = [];
          }
          grouped[dataLocal].push(reg);
        }
      });

      setRegistros(grouped);

      // Calcular adesão (últimos 7 dias)
      const dataInicio7Dias = new Date();
      dataInicio7Dias.setDate(agora.getDate() - 7);

      const { data: registros7Dias } = await supabase
        .from('registros_tomada')
        .select('status')
        .eq('usuario_id', usuarioId)
        .gte('data_hora_prevista', dataInicio7Dias.toISOString())
        .lte('data_hora_prevista', agora.toISOString())
        .in('status', ['Tomado', 'Pulado']);

      if (registros7Dias && registros7Dias.length > 0) {
        const tomados = registros7Dias.filter(r => r.status === 'Tomado').length;
        const total = registros7Dias.length;
        setAdesao(Math.round((tomados / total) * 100));
      } else {
        setAdesao(0);
      }

      setLoading(false);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do paciente");
      console.error("Erro:", error.message);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Tomado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Pulado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <MinusCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      'Tomado': 'default',
      'Pulado': 'destructive',
      'Pendente': 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Clock className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
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
            onClick={() => navigate(isCuidador ? "/pacientes-monitorados" : "/dashboard")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile?.nome}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Perfil de Saúde do Paciente */}
        {isCuidador && (
          <Card className="shadow-[var(--shadow-medium)] mb-6">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="w-6 h-6" />
                Perfil de Saúde: {profile?.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-lg font-semibold">Email</Label>
                  <p className="text-muted-foreground">{profile?.email}</p>
                </div>
                {profile?.alergias && (
                  <div>
                    <Label className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Alergias
                    </Label>
                    <p className="text-muted-foreground">{profile.alergias}</p>
                  </div>
                )}
              </div>
              <Button
                size="lg"
                onClick={() => navigate(`/adicionar-medicamento/${usuarioId}`)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Medicamento para este Paciente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Relatório de Adesão */}
        <Card className="shadow-[var(--shadow-medium)] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Relatório de Adesão (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className={`text-6xl font-bold ${adesao >= 80 ? 'text-green-600' : adesao >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {adesao}%
                </div>
                <p className="text-lg text-muted-foreground mt-2">
                  {adesao >= 80 ? 'Excelente adesão!' : adesao >= 50 ? 'Adesão regular' : 'Adesão baixa'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros de Período */}
        <div className="mb-6">
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dia">Hoje</TabsTrigger>
              <TabsTrigger value="semana">7 Dias</TabsTrigger>
              <TabsTrigger value="mes">30 Dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Histórico de Medicação */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Histórico de Medicação</h2>
          
          {Object.keys(registros).length === 0 ? (
            <Card className="shadow-[var(--shadow-medium)]">
              <CardContent className="p-12 text-center">
                <Clock className="w-20 h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-semibold mb-2">Nenhum registro encontrado</h3>
                <p className="text-xl text-muted-foreground">
                  Não há registros de medicação para o período selecionado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(registros).map(([data, regs]) => (
                <div key={data}>
                  <h3 className="text-xl font-bold text-primary mb-3">{data}</h3>
                  <div className="space-y-3">
                    {regs.map((reg) => {
                      const dataUTC = new Date(reg.data_hora_prevista);
                      const horario = dataUTC.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      });

                      return (
                        <Card key={reg.id} className="shadow-[var(--shadow-soft)]">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(reg.status)}
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-2xl font-bold">{horario}</span>
                                  {getStatusBadge(reg.status)}
                                </div>
                                <p className="text-lg font-semibold">{reg.medicamentos.nome_medicamento}</p>
                                <p className="text-muted-foreground">{reg.medicamentos.dosagem}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoricoPaciente;
