-- Adicionar campos de controle de estoque na tabela medicamentos
ALTER TABLE public.medicamentos 
ADD COLUMN IF NOT EXISTS quantidade_inicial INTEGER,
ADD COLUMN IF NOT EXISTS quantidade_atual INTEGER,
ADD COLUMN IF NOT EXISTS limite_reabastecimento INTEGER;

-- Adicionar campos adicionais na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS contato_emergencia_nome TEXT,
ADD COLUMN IF NOT EXISTS contato_emergencia_telefone TEXT,
ADD COLUMN IF NOT EXISTS alergias TEXT,
ADD COLUMN IF NOT EXISTS condicoes_medicas TEXT;