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
  const [frequencia, setFrequencia] = useState("");
  const [horarios, setHorarios] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const adicionarHorario = () => {
    setHorarios([...horarios, ""]);
  };

  const removerHorario = (index: number) => {
    const novosHorarios = horarios.filter((_, i) => i !== index);
    setHorarios(novosHorarios.length > 0 ? novosHorarios : [""]);
  };

  const atualizarHorario = (index: number, valor: string) => {
    const novosHorarios = [...horarios];
    novosHorarios[index] = valor;
    setHorarios(novosHorarios);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const horariosValidos = horarios.filter(h => h.trim() !== "");
      
      if (horariosValidos.length === 0) {
        toast.error("Adicione pelo menos um horário");
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }

      const { error: medicamentoError } = await supabase
        .from('medicamentos')
        .insert({
          usuario_id: user.id,
          nome_medicamento: nome,
          dosagem: dosagem,
          frequencia: frequencia,
          horarios: horariosValidos,
        });

      if (medicamentoError) throw medicamentoError;

      const agora = new Date();
      const registros = [];

      for (const horario of horariosValidos) {
        const [hora, minuto] = horario.split(':').map(Number);
        const dataHora = new Date(agora);
        dataHora.setHours(hora, minuto, 0, 0);

        if (dataHora < agora) {
          dataHora.setDate(dataHora.getDate() + 1);
        }

        registros.push({
          medicamento_id: null,
          usuario_id: user.id,
          data_hora_prevista: dataHora.toISOString(),
          status: 'Pendente',
        });
      }

      toast.success("Medicamento cadastrado com sucesso!");
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
                <Label htmlFor="frequencia" className="text-xl">Frequência</Label>
                <Input
                  id="frequencia"
                  type="text"
                  placeholder="Ex: A cada 8 horas"
                  value={frequencia}
                  onChange={(e) => setFrequencia(e.target.value)}
                  required
                  className="h-14 text-lg"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xl">Horários</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={adicionarHorario}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Horário
                  </Button>
                </div>

                <div className="space-y-3">
                  {horarios.map((horario, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        type="time"
                        value={horario}
                        onChange={(e) => atualizarHorario(index, e.target.value)}
                        required
                        className="h-14 text-lg flex-1"
                      />
                      {horarios.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="lg"
                          onClick={() => removerHorario(index)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  ))}
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