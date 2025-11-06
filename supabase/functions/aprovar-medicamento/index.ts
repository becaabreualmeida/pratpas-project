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
    const { solicitacao_id, acao } = await req.json();

    if (!solicitacao_id || !acao) {
      throw new Error('Solicitação ID e ação são obrigatórios');
    }

    if (!['aprovar', 'rejeitar'].includes(acao)) {
      throw new Error('Ação inválida');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação (cuidador)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Não autenticado');
    }

    console.log('Processando solicitação:', solicitacao_id, 'ação:', acao);

    // Buscar solicitação
    const { data: solicitacao, error: solicitacaoError } = await supabaseClient
      .from('solicitacoes_medicamento')
      .select('*')
      .eq('id', solicitacao_id)
      .single();

    if (solicitacaoError || !solicitacao) {
      console.error('Erro ao buscar solicitação:', solicitacaoError);
      throw new Error('Solicitação não encontrada');
    }

    // Verificar se o cuidador tem permissão
    const { data: vinculo } = await supabaseClient
      .from('relacionamento_cuidador')
      .select('*')
      .eq('cuidador_id', user.id)
      .eq('idoso_id', solicitacao.paciente_id)
      .single();

    if (!vinculo) {
      throw new Error('Você não tem permissão para gerenciar este paciente');
    }

    if (acao === 'rejeitar') {
      // Apenas atualizar status
      const { error: updateError } = await supabaseClient
        .from('solicitacoes_medicamento')
        .update({ status: 'rejeitado' })
        .eq('id', solicitacao_id);

      if (updateError) {
        console.error('Erro ao rejeitar:', updateError);
        throw updateError;
      }

      console.log('Solicitação rejeitada com sucesso');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Solicitação rejeitada' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aprovar: criar medicamento
    const { data: medicamento, error: medError } = await supabaseClient
      .from('medicamentos')
      .insert({
        usuario_id: solicitacao.paciente_id,
        nome_medicamento: solicitacao.nome_medicamento,
        dosagem: solicitacao.dosagem,
        frequencia_numero: solicitacao.frequencia_numero,
        frequencia_unidade: solicitacao.frequencia_unidade,
        horario_inicio: solicitacao.horario_inicio,
        data_inicio: solicitacao.data_inicio,
        data_fim: solicitacao.data_fim,
        quantidade_inicial: solicitacao.quantidade_inicial,
        quantidade_atual: solicitacao.quantidade_atual,
        limite_reabastecimento: solicitacao.limite_reabastecimento,
        quantidade_embalagem: solicitacao.quantidade_embalagem,
        dias_antecedencia_reposicao: solicitacao.dias_antecedencia_reposicao,
        ativo: true,
      })
      .select()
      .single();

    if (medError) {
      console.error('Erro ao criar medicamento:', medError);
      throw medError;
    }

    // Chamar edge function para agendar registros
    const { error: agendarError } = await supabaseClient.functions.invoke(
      'agendar-medicamento',
      {
        body: { medicamento_id: medicamento.id },
      }
    );

    if (agendarError) {
      console.error('Erro ao agendar medicamento:', agendarError);
    }

    // Atualizar status da solicitação
    const { error: updateError } = await supabaseClient
      .from('solicitacoes_medicamento')
      .update({ status: 'aprovado' })
      .eq('id', solicitacao_id);

    if (updateError) {
      console.error('Erro ao atualizar solicitação:', updateError);
    }

    console.log('Medicamento aprovado e criado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Medicamento aprovado com sucesso' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});