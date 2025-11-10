import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      paciente_id,
      nome_medicamento,
      dosagem,
      horario_inicio,
      frequencia_numero,
      frequencia_unidade,
      data_inicio = null,
      data_fim = null,
      quantidade_inicial = null,
      limite_reabastecimento = null,
      quantidade_embalagem = null,
      dias_antecedencia_reposicao = null,
      data_reposicao = null,
    } = body ?? {};

    if (!paciente_id || !nome_medicamento || !dosagem || !horario_inicio || !frequencia_numero || !frequencia_unidade) {
      throw new Error('Campos obrigatórios ausentes');
    }

    // Cliente autenticado para identificar o cuidador
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Cliente com chave de serviço para operações no banco (bypass RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Não autenticado');
    }

    // Verificar vínculo cuidador-paciente
    const { data: vinculo } = await serviceClient
      .from('relacionamento_cuidador')
      .select('id')
      .eq('cuidador_id', user.id)
      .eq('idoso_id', paciente_id)
      .single();

    if (!vinculo) {
      throw new Error('Você não tem permissão para gerenciar este paciente');
    }

    // Inserir medicamento para o paciente
    const { data: medicamento, error: medError } = await serviceClient
      .from('medicamentos')
      .insert({
        usuario_id: paciente_id,
        nome_medicamento,
        dosagem,
        horario_inicio,
        frequencia_numero,
        frequencia_unidade,
        data_inicio,
        data_fim,
        quantidade_inicial,
        quantidade_atual: quantidade_inicial,
        limite_reabastecimento,
        quantidade_embalagem,
        dias_antecedencia_reposicao,
        data_reposicao,
        ativo: true,
      })
      .select()
      .single();

    if (medError) {
      console.error('Erro ao criar medicamento:', medError);
      throw medError;
    }

    // Agendar registros de tomada
    const { error: agendarError } = await authClient.functions.invoke('agendar-medicamento', {
      body: { medicamento_id: medicamento.id },
    });

    if (agendarError) {
      console.error('Erro ao agendar medicamento:', agendarError);
    }

    return new Response(
      JSON.stringify({ success: true, medicamento_id: medicamento.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Erro inesperado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});