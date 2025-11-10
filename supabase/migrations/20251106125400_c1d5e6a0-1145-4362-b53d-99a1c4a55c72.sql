-- Adicionar política RLS para permitir que idosos busquem cuidadores por email
CREATE POLICY "Usuários autenticados podem buscar cuidadores por email"
ON public.profiles
FOR SELECT
TO authenticated
USING (tipo_perfil = 'cuidador');