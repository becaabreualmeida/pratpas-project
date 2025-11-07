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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Não autenticado');
    }

    console.log('Gerando código para paciente:', user.id);

    // Gerar código de 5 dígitos
    const codigo = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Data de expiração: 10 minutos no futuro
    const dataExpiracao = new Date();
    dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 10);

    // Salvar código no banco
    const { data: codigoData, error: codigoError } = await supabaseClient
      .from('codigos_convite')
      .insert({
        paciente_id: user.id,
        codigo: codigo,
        data_expiracao: dataExpiracao.toISOString(),
      })
      .select()
      .single();

    if (codigoError) {
      console.error('Erro ao criar código:', codigoError);
      throw codigoError;
    }

    console.log('Código gerado com sucesso:', codigo);

    return new Response(
      JSON.stringify({ 
        codigo: codigo,
        data_expiracao: dataExpiracao.toISOString() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? 'Erro inesperado' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});