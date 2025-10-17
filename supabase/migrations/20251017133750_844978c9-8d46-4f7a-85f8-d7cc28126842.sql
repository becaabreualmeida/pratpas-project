-- Atualizar tabela medicamentos com novos campos de frequência
ALTER TABLE public.medicamentos
ADD COLUMN horario_inicio TEXT,
ADD COLUMN frequencia_numero INTEGER,
ADD COLUMN frequencia_unidade TEXT CHECK (frequencia_unidade IN ('horas', 'dias', 'semanas', 'meses'));

-- Remover campos antigos que não serão mais usados
ALTER TABLE public.medicamentos
DROP COLUMN IF EXISTS frequencia,
DROP COLUMN IF EXISTS horarios;

-- Adicionar campo para armazenar o horário inicial
COMMENT ON COLUMN public.medicamentos.horario_inicio IS 'Horário de início no formato HH:mm';
COMMENT ON COLUMN public.medicamentos.frequencia_numero IS 'Número da frequência (ex: 8)';
COMMENT ON COLUMN public.medicamentos.frequencia_unidade IS 'Unidade de tempo: horas, dias, semanas ou meses';