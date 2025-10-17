import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface ConfirmarTomadaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registroId: string;
  nomeMedicamento: string;
  dosagem: string;
  onConfirmar: () => void;
}

const ConfirmarTomada = ({ 
  open, 
  onOpenChange, 
  registroId, 
  nomeMedicamento, 
  dosagem,
  onConfirmar 
}: ConfirmarTomadaProps) => {
  const [loading, setLoading] = useState(false);

  const handleAcao = async (status: 'Tomado' | 'Pulado') => {
    setLoading(true);
    try {
      const updateData: any = { status };
      
      if (status === 'Tomado') {
        updateData.data_hora_realizada = new Date().toISOString();
      }

      const { error } = await supabase
        .from('registros_tomada')
        .update(updateData)
        .eq('id', registroId);

      if (error) throw error;

      toast.success(status === 'Tomado' ? 'Tomada registrada!' : 'Tomada pulada');
      onConfirmar();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao atualizar registro');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl text-center">Hora do Remédio!</DialogTitle>
          <DialogDescription className="text-xl text-center pt-4">
            Tomar <span className="font-bold text-foreground">{nomeMedicamento}</span>
            <br />
            <span className="text-muted-foreground">{dosagem}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            size="lg"
            className="h-16 text-xl font-semibold bg-green-600 hover:bg-green-700"
            onClick={() => handleAcao('Tomado')}
            disabled={loading}
          >
            <Check className="w-6 h-6 mr-2" />
            Tomei
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-16 text-xl font-semibold"
            onClick={() => handleAcao('Pulado')}
            disabled={loading}
          >
            <X className="w-6 h-6 mr-2" />
            Pular
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmarTomada;