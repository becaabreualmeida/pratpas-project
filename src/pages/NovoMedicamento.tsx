import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Save, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NovoMedicamento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [loading, setLoading] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (id) {
      carregarMedicamento();
    }
  }, [id]);

  const carregarMedicamento = async () => {
    try {
      const { data, error } = await supabase
        .from('medicamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setNome(data.nome_medicamento);
        setDosagem(data.dosagem);
        setHorarioInicio(data.horario_inicio || "");
        setFrequenciaNumero(data.frequencia_numero?.toString() || "");
        setFrequenciaUnidade(data.frequencia_unidade || "horas");
        setDataInicio(data.data_inicio || "");
        setDataFim(data.data_fim || "");
        setQuantidadeInicial(data.quantidade_inicial?.toString() || "");
        setLimiteReabastecimento(data.limite_reabastecimento?.toString() || "");
        setQuantidadeEmbalagem(data.quantidade_embalagem?.toString() || "");
        setDiasAntecedenciaReposicao(data.dias_antecedencia_reposicao?.toString() || "");
      }
    } catch (error: any) {
      toast.error("Erro ao carregar medicamento");
      console.error(error);
    }
  };

  const calcularDataReposicao = () => {
    if (!quantidadeEmbalagem || !frequenciaNumero || !diasAntecedenciaReposicao || !dataInicio) {
      return null;
    }

    const qtdEmbalagem = parseInt(quantidadeEmbalagem);
    const freq = parseInt(frequenciaNumero);
    const diasAntecedencia = parseInt(diasAntecedenciaReposicao);
    
    // Calcular quantos dias o medicamento vai durar
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

    // Data de reposição = data de início + dias de duração - dias de antecedência
    const dataInicioDate = new Date(dataInicio);
    const dataReposicao = new Date(dataInicioDate);
    dataReposicao.setDate(dataReposicao.getDate() + diasDuracao - diasAntecedencia);
    
    return dataReposicao.toISOString().split('T')[0];
  };

  const handleExcluir = async () => {
    if (!id) return;
    
    setExcluindo(true);
    try {
      // Excluir os registros de tomada associados
      const { error: errorRegistros } = await supabase
        .from('registros_tomada')
        .delete()
        .eq('medicamento_id', id);

      if (errorRegistros) throw errorRegistros;

      // Excluir o medicamento
      const { error: errorMedicamento } = await supabase
        .from('medicamentos')
        .delete()
        .eq('id', id);

      if (errorMedicamento) throw errorMedicamento;

      toast.success("Medicamento excluído com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Erro ao excluir medicamento");
      console.error(error);
    } finally {
      setExcluindo(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!horarioInicio) {
        toast.error("Por favor, defina o horário de início");
        setLoading(false);
        return;
      }

      if (!frequenciaNumero || parseInt(frequenciaNumero) <= 0) {
        toast.error("Por favor, defina uma frequência válida");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }

      const dataReposicao = calcularDataReposicao();

      // Criar ou atualizar o medicamento
      const medicamentoData = {
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

      let medicamento;
      if (id) {
        // Atualizar medicamento existente
        const { data, error: medicamentoError } = await supabase
          .from('medicamentos')
          .update(medicamentoData)
          .eq('id', id)
          .select()
          .single();

        if (medicamentoError) throw medicamentoError;
        medicamento = data;
      } else {
        // Criar novo medicamento
        const { data, error: medicamentoError } = await supabase
          .from('medicamentos')
          .insert({
            ...medicamentoData,
            usuario_id: user.id,
          })
          .select()
          .single();

        if (medicamentoError) throw medicamentoError;
        medicamento = data;
      }

      // Chamar edge function para agendar os lembretes (apenas para novos medicamentos)
      if (!id) {
        const { error: agendamentoError } = await supabase.functions.invoke('agendar-medicamento', {
          body: {
            medicamento_id: medicamento.id,
            usuario_id: user.id,
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
          toast.success("Medicamento cadastrado e lembretes agendados!");
        }
      } else {
        toast.success("Medicamento atualizado com sucesso!");
      }

      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Erro ao cadastrar medicamento");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold">{id ? "Editar Medicamento" : "Novo Medicamento"}</h1>
          <div className="ml-auto flex gap-2">
            {id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="h-12 px-6 text-lg font-semibold"
                    disabled={excluindo}
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl">Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription className="text-lg">
                      Tem certeza que deseja excluir este medicamento? Esta ação não pode ser desfeita e todos os lembretes associados serão removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="h-12 px-6 text-lg">Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      className="h-12 px-6 text-lg bg-destructive hover:bg-destructive/90"
                      onClick={handleExcluir}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              className="h-12 px-6 text-lg font-semibold"
              onClick={handleSubmit}
              disabled={loading}
            >
              <Save className="w-5 h-5 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-[var(--shadow-medium)]">
          <CardHeader>
            <CardTitle className="text-2xl">Informações do Medicamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <p className="text-sm text-muted-foreground">Quantas unidades vêm em cada embalagem?</p>
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
                <p className="text-sm text-muted-foreground">Com quantos dias antes do medicamento acabar você quer ser lembrado?</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NovoMedicamento;