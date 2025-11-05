import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, AlertTriangle, Pill } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Paciente {
  nome: string;
  email: string;
  alergias: string | null;
  condicoes_medicas: string | null;
}

interface MedicamentoAtual {
  nome_medicamento: string;
  dosagem: string;
  data_fim: string | null;
}

const AdicionarMedicamentoCuidador = () => {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  
  // Dados do paciente
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [medicamentosAtuais, setMedicamentosAtuais] = useState<MedicamentoAtual[]>([]);
  
  // Dados do formulário
  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [frequenciaNumero, setFrequenciaNumero] = useState("");
  const [frequenciaUnidade, setFrequenciaUnidade] = useState("horas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [quantidadeInicial, setQuantidadeInicial] = useState("");
  const [limiteReabastecimento, setLimiteReabastecimento] = useState("");
  const [quantidadeEmbalagem, setQuantidadeEmbalagem] = useState("");
  const [diasAntecedenciaReposicao, setDiasAntecedenciaReposicao] = useState("");

  useEffect(() => {
    carregarDadosPaciente();
  }, [pacienteId]);

  const carregarDadosPaciente = async () => {
    if (!pacienteId) {
      toast.error("ID do paciente não fornecido");
      navigate("/pacientes-monitorados");
      return;
    }

    try {
      // Verificar se o cuidador tem permissão para acessar este paciente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }

      const { data: vinculo } = await supabase
        .from('relacionamento_cuidador')
        .select('id')
        .eq('cuidador_id', user.id)
        .eq('idoso_id', pacienteId)
        .single();

      if (!vinculo) {
        toast.error("Você não tem permissão para gerenciar este paciente");
        navigate("/pacientes-monitorados");
        return;
      }

      // Carregar dados do paciente
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nome, email, alergias, condicoes_medicas')
        .eq('id', pacienteId)
        .single();

      if (profileError) throw profileError;
      setPaciente(profileData);

      // Carregar medicamentos atuais do paciente
      const hoje = new Date().toISOString().split('T')[0];
      const { data: medicamentos, error: medsError } = await supabase
        .from('medicamentos')
        .select('nome_medicamento, dosagem, data_fim')
        .eq('usuario_id', pacienteId)
        .or(`data_fim.is.null,data_fim.gte.${hoje}`)
        .eq('ativo', true);

      if (medsError) throw medsError;
      setMedicamentosAtuais(medicamentos || []);

    } catch (error: any) {
      toast.error("Erro ao carregar dados do paciente");
      console.error(error);
      navigate("/pacientes-monitorados");
    } finally {
      setCarregando(false);
    }
  };

  const calcularDataReposicao = () => {
    if (!quantidadeEmbalagem || !frequenciaNumero || !diasAntecedenciaReposicao || !dataInicio) {
      return null;
    }

    const qtdEmbalagem = parseInt(quantidadeEmbalagem);
    const freq = parseInt(frequenciaNumero);
    const diasAntecedencia = parseInt(diasAntecedenciaReposicao);
    
    let diasDuracao = 0;
    switch (frequenciaUnidade) {
      case 'horas':
        diasDuracao = Math.floor((qtdEmbalagem * freq) / 24);
        break;
      case 'dias':
        diasDuracao = qtdEmbalagem * freq;
        break;
      case 'semanas':
        diasDuracao = qtdEmbalagem * freq * 7;
        break;
      case 'meses':
        diasDuracao = qtdEmbalagem * freq * 30;
        break;
    }

    const dataInicioDate = new Date(dataInicio);
    const dataReposicao = new Date(dataInicioDate);
    dataReposicao.setDate(dataReposicao.getDate() + diasDuracao - diasAntecedencia);
    
    return dataReposicao.toISOString().split('T')[0];
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!horarioInicio) {
      toast.error("Por favor, defina o horário de início");
      return;
    }

    if (!frequenciaNumero || parseInt(frequenciaNumero) <= 0) {
      toast.error("Por favor, defina uma frequência válida");
      return;
    }

    // Abrir modal de segurança
    setModalAberto(true);
  };

  const handleConfirmarESalvar = async () => {
    setLoading(true);
    setModalAberto(false);

    try {
      const dataReposicao = calcularDataReposicao();

      const medicamentoData = {
        usuario_id: pacienteId,
        nome_medicamento: nome,
        dosagem: dosagem,
        horario_inicio: horarioInicio,
        frequencia_numero: parseInt(frequenciaNumero),
        frequencia_unidade: frequenciaUnidade,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        quantidade_inicial: quantidadeInicial ? parseInt(quantidadeInicial) : null,
        quantidade_atual: quantidadeInicial ? parseInt(quantidadeInicial) : null,
        limite_reabastecimento: limiteReabastecimento ? parseInt(limiteReabastecimento) : null,
        quantidade_embalagem: quantidadeEmbalagem ? parseInt(quantidadeEmbalagem) : null,
        dias_antecedencia_reposicao: diasAntecedenciaReposicao ? parseInt(diasAntecedenciaReposicao) : null,
        data_reposicao: dataReposicao,
      };

      const { data: medicamento, error: medicamentoError } = await supabase
        .from('medicamentos')
        .insert(medicamentoData)
        .select()
        .single();

      if (medicamentoError) throw medicamentoError;

      // Agendar lembretes
      const { error: agendamentoError } = await supabase.functions.invoke('agendar-medicamento', {
        body: {
          medicamento_id: medicamento.id,
          usuario_id: pacienteId,
          horario_inicio: horarioInicio,
          frequencia_numero: parseInt(frequenciaNumero),
          frequencia_unidade: frequenciaUnidade,
          data_inicio: dataInicio || null,
          data_fim: dataFim || null,
        },
      });

      if (agendamentoError) {
        console.error('Erro ao agendar lembretes:', agendamentoError);
        toast.error("Medicamento salvo, mas houve erro ao agendar lembretes");
      } else {
        toast.success("Medicamento adicionado com sucesso!");
      }

      navigate(`/gerenciamento-paciente/${pacienteId}`);
    } catch (error: any) {
      toast.error("Erro ao adicionar medicamento");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
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
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate(`/gerenciamento-paciente/${pacienteId}`)}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Adicionar Medicamento</h1>
          <Button
            className="ml-auto h-12 px-6 text-lg font-semibold"
            onClick={handleFormSubmit}
            disabled={loading}
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-[var(--shadow-medium)] mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Paciente: {paciente?.nome}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="shadow-[var(--shadow-medium)]">
          <CardHeader>
            <CardTitle className="text-2xl">Informações do Medicamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xl">Nome do Medicamento</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Ex: Paracetamol"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosagem" className="text-xl">Dosagem</Label>
                <Input
                  id="dosagem"
                  type="text"
                  placeholder="Ex: 500mg - 1 comprimido"
                  value={dosagem}
                  onChange={(e) => setDosagem(e.target.value)}
                  required
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-inicio" className="text-xl">Data de Início</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  required
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-fim" className="text-xl">Data de Fim</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  required
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario-inicio" className="text-xl">Horário de Início</Label>
                <Input
                  id="horario-inicio"
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                  required
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-xl">Repetir a cada</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 8"
                    value={frequenciaNumero}
                    onChange={(e) => setFrequenciaNumero(e.target.value)}
                    required
                    className="h-14 text-lg flex-1"
                  />
                  <select
                    value={frequenciaUnidade}
                    onChange={(e) => setFrequenciaUnidade(e.target.value)}
                    className="h-14 text-lg px-4 rounded-md border border-input bg-background"
                  >
                    <option value="horas">Horas</option>
                    <option value="dias">Dias</option>
                    <option value="semanas">Semanas</option>
                    <option value="meses">Meses</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade-inicial" className="text-xl">Quantidade Inicial</Label>
                <Input
                  id="quantidade-inicial"
                  type="number"
                  min="1"
                  placeholder="Ex: 30"
                  value={quantidadeInicial}
                  onChange={(e) => setQuantidadeInicial(e.target.value)}
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="limite-reabastecimento" className="text-xl">Alertar quando restar</Label>
                <Input
                  id="limite-reabastecimento"
                  type="number"
                  min="1"
                  placeholder="Ex: 5"
                  value={limiteReabastecimento}
                  onChange={(e) => setLimiteReabastecimento(e.target.value)}
                  className="h-14 text-lg"
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-medium)] mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">Controle de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="quantidade-embalagem" className="text-xl">Quantidade na embalagem</Label>
                <Input
                  id="quantidade-embalagem"
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  value={quantidadeEmbalagem}
                  onChange={(e) => setQuantidadeEmbalagem(e.target.value)}
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dias-antecedencia" className="text-xl">Lembrar de repor com quantos dias de antecedência</Label>
                <Input
                  id="dias-antecedencia"
                  type="number"
                  min="1"
                  placeholder="Ex: 2"
                  value={diasAntecedenciaReposicao}
                  onChange={(e) => setDiasAntecedenciaReposicao(e.target.value)}
                  className="h-14 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal de Alerta de Segurança */}
      <AlertDialog open={modalAberto} onOpenChange={setModalAberto}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              Verificação de Segurança
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Você está adicionando <strong>{nome}</strong> para <strong>{paciente?.nome}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                ATENÇÃO: Informações de Saúde do Paciente
              </h3>
              <div className="space-y-2">
                <div>
                  <Label className="font-semibold">Alergias:</Label>
                  <p className="text-muted-foreground">
                    {paciente?.alergias || "Nenhuma alergia registrada"}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Condições Médicas:</Label>
                  <p className="text-muted-foreground">
                    {paciente?.condicoes_medicas || "Nenhuma condição registrada"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-accent rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">Medicamentos Atuais deste Paciente:</h3>
              {medicamentosAtuais.length === 0 ? (
                <p className="text-muted-foreground">Nenhum medicamento ativo registrado</p>
              ) : (
                <ul className="space-y-2">
                  {medicamentosAtuais.map((med, index) => (
                    <li key={index} className="border-l-4 border-primary pl-3">
                      <p className="font-semibold">{med.nome_medicamento}</p>
                      <p className="text-sm text-muted-foreground">
                        Dosagem: {med.dosagem}
                        {med.data_fim && ` • Fim: ${new Date(med.data_fim).toLocaleDateString('pt-BR')}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarESalvar} disabled={loading}>
              Confirmar e Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdicionarMedicamentoCuidador;
