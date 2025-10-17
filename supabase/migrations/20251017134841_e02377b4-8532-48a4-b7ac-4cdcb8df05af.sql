-- Adicionar campos de data de início e fim na tabela medicamentos
ALTER TABLE public.medicamentos
ADD COLUMN data_inicio DATE,
ADD COLUMN data_fim DATE;