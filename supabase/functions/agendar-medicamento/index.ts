import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { toZonedTime, fromZonedTime } from "https://esm.sh/date-fns-tz@3.2.0";

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
    const timezone = 'America/Sao_Paulo';
    const agora = toZonedTime(new Date(), timezone);

    // Parsear horário inicial
    const [hora, minuto] = horario_inicio.split(':').map(Number);
    
    // Criar data de início no timezone do Brasil
    // Se data_inicio foi fornecida, usar ela, senão usar hoje
    const dataBase = data_inicio ? data_inicio : agora.toISOString().split('T')[0];
    
    // Criar uma string de data/hora no formato ISO no timezone do Brasil
    // Exemplo: "2024-01-15T08:42:00" (sem Z, para ser interpretado como local)
    const dataHoraString = `${dataBase}T${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:00`;
    
    // Criar Date object e converter para timezone do Brasil
    // fromZonedTime trata a string como se fosse no timezone especificado
    let dataInicio = fromZonedTime(dataHoraString, timezone);
    
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
    let dataLimite: Date;
    if (data_fim) {
      const dataLimiteString = `${data_fim}T23:59:59`;
      dataLimite = fromZonedTime(dataLimiteString, timezone);
    } else {
      dataLimite = new Date(agora.getTime() + 90 * 24 * 60 * 60 * 1000);
    }

    // Gerar todos os registros
    while (dataHoraAtual <= dataLimite) {
      // dataHoraAtual já está em UTC (foi criada com fromZonedTime)
      // Apenas salvamos diretamente
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