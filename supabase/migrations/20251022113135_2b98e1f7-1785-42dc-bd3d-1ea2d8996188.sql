-- Adicionar campos de controle de estoque e reposição na tabela medicamentos
ALTER TABLE public.medicamentos
ADD COLUMN IF NOT EXISTS quantidade_embalagem integer,
ADD COLUMN IF NOT EXISTS dias_antecedencia_reposicao integer,
ADD COLUMN IF NOT EXISTS data_reposicao date;