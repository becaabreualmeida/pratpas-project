import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { medicamento_id, usuario_id, horario_inicio, frequencia_numero, frequencia_unidade, data_inicio, data_fim } = await req.json();

    console.log('Agendando medicamento:', { medicamento_id, usuario_id, horario_inicio, frequencia_numero, frequencia_unidade, data_inicio, data_fim });

    // Calcular lembretes entre data_inicio e data_fim
    const registros = [];
    const agora = new Date();

    // Parsear horário inicial
    const [hora, minuto] = horario_inicio.split(':').map(Number);
    
    // Determinar data de início
    let dataInicio = data_inicio ? new Date(data_inicio) : new Date(agora);
    dataInicio.setHours(hora, minuto, 0, 0);
    
    // Se a data de início for hoje e o horário já passou, começar do próximo horário
    if (dataInicio.toDateString() === agora.toDateString() && dataInicio < agora) {
      // Calcular intervalo em milissegundos
      let intervaloMs = 0;
      switch (frequencia_unidade) {
        case 'horas':
          intervaloMs = frequencia_numero * 60 * 60 * 1000;
          break;
        case 'dias':
          intervaloMs = frequencia_numero * 24 * 60 * 60 * 1000;
          break;
        case 'semanas':
          intervaloMs = frequencia_numero * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'meses':
          intervaloMs = frequencia_numero * 30 * 24 * 60 * 60 * 1000;
          break;
      }
      
      // Avançar para o próximo horário válido
      while (dataInicio < agora) {
        dataInicio = new Date(dataInicio.getTime() + intervaloMs);
      }
    }
    
    let dataHoraAtual = new Date(dataInicio);

    // Calcular intervalo em milissegundos
    let intervaloMs = 0;
    switch (frequencia_unidade) {
      case 'horas':
        intervaloMs = frequencia_numero * 60 * 60 * 1000;
        break;
      case 'dias':
        intervaloMs = frequencia_numero * 24 * 60 * 60 * 1000;
        break;
      case 'semanas':
        intervaloMs = frequencia_numero * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'meses':
        intervaloMs = frequencia_numero * 30 * 24 * 60 * 60 * 1000;
        break;
    }

    // Determinar data limite (data_fim ou 90 dias)
    const dataLimite = data_fim 
      ? new Date(data_fim) 
      : new Date(agora.getTime() + 90 * 24 * 60 * 60 * 1000);
    dataLimite.setHours(23, 59, 59, 999);

    // Gerar todos os registros
    while (dataHoraAtual <= dataLimite) {
      registros.push({
        medicamento_id,
        usuario_id,
        data_hora_prevista: dataHoraAtual.toISOString(),
        status: 'Pendente',
      });

      dataHoraAtual = new Date(dataHoraAtual.getTime() + intervaloMs);
    }

    console.log(`Criando ${registros.length} registros de tomada`);

    // Inserir registros no banco
    const { data, error } = await supabase
      .from('registros_tomada')
      .insert(registros);

    if (error) {
      console.error('Erro ao inserir registros:', error);
      throw error;
    }

    console.log('Registros criados com sucesso');

    const diasCalculados = data_fim 
      ? Math.ceil((new Date(data_fim).getTime() - new Date(data_inicio || agora).getTime()) / (1000 * 60 * 60 * 24))
      : 90;

    return new Response(
      JSON.stringify({ 
        success: true, 
        registros_criados: registros.length,
        mensagem: `${registros.length} lembretes agendados entre ${new Date(data_inicio || agora).toLocaleDateString('pt-BR')} e ${new Date(data_fim || new Date(agora.getTime() + 90 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Erro na função agendar-medicamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});