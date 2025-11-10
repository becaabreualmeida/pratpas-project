-- 1. Criar tabela de códigos de convite
CREATE TABLE public.codigos_convite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.codigos_convite ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para códigos_convite
CREATE POLICY "Pacientes podem ver seus próprios códigos"
  ON public.codigos_convite
  FOR SELECT
  USING (auth.uid() = paciente_id);

CREATE POLICY "Pacientes podem criar códigos"
  ON public.codigos_convite
  FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

CREATE POLICY "Cuidadores podem ver códigos válidos"
  ON public.codigos_convite
  FOR SELECT
  USING (NOT usado AND data_expiracao > NOW());

-- 2. Criar tabela de solicitações de medicamento
CREATE TABLE public.solicitacoes_medicamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_medicamento TEXT NOT NULL,
  dosagem TEXT NOT NULL,
  frequencia_numero INTEGER,
  frequencia_unidade TEXT,
  horario_inicio TEXT,
  data_inicio DATE,
  data_fim DATE,
  quantidade_inicial INTEGER,
  quantidade_atual INTEGER,
  limite_reabastecimento INTEGER,
  quantidade_embalagem INTEGER,
  dias_antecedencia_reposicao INTEGER,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.solicitacoes_medicamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para solicitações
CREATE POLICY "Pacientes podem ver suas solicitações"
  ON public.solicitacoes_medicamento
  FOR SELECT
  USING (auth.uid() = paciente_id);

CREATE POLICY "Pacientes podem criar solicitações"
  ON public.solicitacoes_medicamento
  FOR INSERT
  WITH CHECK (auth.uid() = paciente_id);

CREATE POLICY "Cuidadores podem ver solicitações dos seus pacientes"
  ON public.solicitacoes_medicamento
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM relacionamento_cuidador rc
    WHERE rc.cuidador_id = auth.uid() AND rc.idoso_id = paciente_id
  ));

CREATE POLICY "Cuidadores podem atualizar solicitações dos seus pacientes"
  ON public.solicitacoes_medicamento
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM relacionamento_cuidador rc
    WHERE rc.cuidador_id = auth.uid() AND rc.idoso_id = paciente_id
  ));

-- 3. Adicionar campo permite_auto_cadastro na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN permite_auto_cadastro BOOLEAN DEFAULT FALSE;

-- Trigger para atualizar updated_at em solicitacoes_medicamento
CREATE TRIGGER update_solicitacoes_medicamento_updated_at
  BEFORE UPDATE ON public.solicitacoes_medicamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();