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

    const { medicamento_id, usuario_id, horario_inicio, frequencia_numero, frequencia_unidade } = await req.json();

    console.log('Agendando medicamento:', { medicamento_id, usuario_id, horario_inicio, frequencia_numero, frequencia_unidade });

    // Calcular próximos 90 dias de lembretes
    const diasParaAgendar = 90;
    const registros = [];
    const agora = new Date();

    // Parsear horário inicial
    const [hora, minuto] = horario_inicio.split(':').map(Number);
    
    let dataHoraAtual = new Date(agora);
    dataHoraAtual.setHours(hora, minuto, 0, 0);

    // Se o horário inicial já passou hoje, começar amanhã
    if (dataHoraAtual < agora) {
      dataHoraAtual.setDate(dataHoraAtual.getDate() + 1);
    }

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

    const dataLimite = new Date(agora);
    dataLimite.setDate(dataLimite.getDate() + diasParaAgendar);

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        registros_criados: registros.length,
        mensagem: `${registros.length} lembretes agendados para os próximos ${diasParaAgendar} dias`
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