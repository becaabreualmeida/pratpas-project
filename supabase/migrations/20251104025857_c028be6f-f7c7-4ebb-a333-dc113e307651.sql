-- Adicionar tipo de perfil aos profiles
DO $$ BEGIN
  CREATE TYPE public.tipo_perfil AS ENUM ('idoso', 'cuidador');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna tipo_perfil na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tipo_perfil public.tipo_perfil DEFAULT 'idoso';

-- Criar tabela de relacionamento cuidador-idoso
CREATE TABLE IF NOT EXISTS public.relacionamento_cuidador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idoso_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cuidador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_vinculo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idoso_id, cuidador_id)
);

-- Enable RLS
ALTER TABLE public.relacionamento_cuidador ENABLE ROW LEVEL SECURITY;

-- Política: Idosos podem ver seus cuidadores
CREATE POLICY "Idosos podem ver seus cuidadores"
ON public.relacionamento_cuidador
FOR SELECT
USING (auth.uid() = idoso_id);

-- Política: Cuidadores podem ver seus idosos
CREATE POLICY "Cuidadores podem ver seus idosos"
ON public.relacionamento_cuidador
FOR SELECT
USING (auth.uid() = cuidador_id);

-- Política: Idosos podem adicionar cuidadores
CREATE POLICY "Idosos podem adicionar cuidadores"
ON public.relacionamento_cuidador
FOR INSERT
WITH CHECK (auth.uid() = idoso_id);

-- Política: Idosos podem remover cuidadores
CREATE POLICY "Idosos podem remover cuidadores"
ON public.relacionamento_cuidador
FOR DELETE
USING (auth.uid() = idoso_id);

-- Atualizar políticas de medicamentos para permitir acesso por cuidadores
CREATE POLICY "Cuidadores podem ver medicamentos dos seus idosos"
ON public.medicamentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.relacionamento_cuidador rc
    WHERE rc.cuidador_id = auth.uid()
    AND rc.idoso_id = medicamentos.usuario_id
  )
);

-- Atualizar políticas de registros_tomada para permitir acesso por cuidadores
CREATE POLICY "Cuidadores podem ver registros dos seus idosos"
ON public.registros_tomada
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.relacionamento_cuidador rc
    WHERE rc.cuidador_id = auth.uid()
    AND rc.idoso_id = registros_tomada.usuario_id
  )
);

-- Política para profiles: cuidadores podem ver perfis dos seus idosos
CREATE POLICY "Cuidadores podem ver perfis dos seus idosos"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.relacionamento_cuidador rc
    WHERE rc.cuidador_id = auth.uid()
    AND rc.idoso_id = profiles.id
  )
);