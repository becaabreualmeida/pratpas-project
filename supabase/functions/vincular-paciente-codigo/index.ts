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
    const { codigo } = await req.json();

    if (!codigo) {
      throw new Error('Código é obrigatório');
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

    console.log('Cuidador tentando vincular com código:', codigo);

    // Buscar código válido
    const { data: codigoData, error: codigoError } = await supabaseClient
      .from('codigos_convite')
      .select('*')
      .eq('codigo', codigo)
      .eq('usado', false)
      .gt('data_expiracao', new Date().toISOString())
      .single();

    if (codigoError || !codigoData) {
      console.error('Código inválido ou expirado:', codigoError);
      throw new Error('Código inválido ou expirado');
    }

    console.log('Código válido encontrado, paciente_id:', codigoData.paciente_id);

    // Verificar se o vínculo já existe
    const { data: vinculoExistente } = await supabaseClient
      .from('relacionamento_cuidador')
      .select('*')
      .eq('cuidador_id', user.id)
      .eq('idoso_id', codigoData.paciente_id)
      .single();

    if (vinculoExistente) {
      console.log('Vínculo já existe');
      throw new Error('Você já está vinculado a este paciente');
    }

    // Criar cliente com service role para bypass de RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Criar relacionamento usando service role
    const { error: relacionamentoError } = await supabaseAdmin
      .from('relacionamento_cuidador')
      .insert({
        cuidador_id: user.id,
        idoso_id: codigoData.paciente_id,
      });

    if (relacionamentoError) {
      console.error('Erro ao criar relacionamento:', relacionamentoError);
      throw relacionamentoError;
    }

    // Marcar código como usado
    const { error: updateError } = await supabaseAdmin
      .from('codigos_convite')
      .update({ usado: true })
      .eq('id', codigoData.id);

    if (updateError) {
      console.error('Erro ao marcar código como usado:', updateError);
    }

    console.log('Vínculo criado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Paciente vinculado com sucesso' 
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