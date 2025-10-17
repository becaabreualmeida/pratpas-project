import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Save } from "lucide-react";

const NovoMedicamento = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [dosagem, setDosagem] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [frequenciaNumero, setFrequenciaNumero] = useState("");
  const [frequenciaUnidade, setFrequenciaUnidade] = useState("horas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [loading, setLoading] = useState(false);


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

      // Criar o medicamento
      const { data: medicamento, error: medicamentoError } = await supabase
        .from('medicamentos')
        .insert({
          usuario_id: user.id,
          nome_medicamento: nome,
          dosagem: dosagem,
          horario_inicio: horarioInicio,
          frequencia_numero: parseInt(frequenciaNumero),
          frequencia_unidade: frequenciaUnidade,
          data_inicio: dataInicio || null,
          data_fim: dataFim || null,
        })
        .select()
        .single();

      if (medicamentoError) throw medicamentoError;

      // Chamar edge function para agendar os lembretes
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
          <h1 className="text-2xl font-bold">Novo Medicamento</h1>
          <Button
            className="ml-auto h-12 px-6 text-lg font-semibold"
            onClick={handleSubmit}
            disabled={loading}
          >
            <Save className="w-5 h-5 mr-2" />
            Salvar
          </Button>
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
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NovoMedicamento;