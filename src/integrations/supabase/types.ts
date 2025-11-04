export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      medicamentos: {
        Row: {
          ativo: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          data_reposicao: string | null
          dias_antecedencia_reposicao: number | null
          dosagem: string
          frequencia_numero: number | null
          frequencia_unidade: string | null
          horario_inicio: string | null
          id: string
          limite_reabastecimento: number | null
          nome_medicamento: string
          quantidade_atual: number | null
          quantidade_embalagem: number | null
          quantidade_inicial: number | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          data_reposicao?: string | null
          dias_antecedencia_reposicao?: number | null
          dosagem: string
          frequencia_numero?: number | null
          frequencia_unidade?: string | null
          horario_inicio?: string | null
          id?: string
          limite_reabastecimento?: number | null
          nome_medicamento: string
          quantidade_atual?: number | null
          quantidade_embalagem?: number | null
          quantidade_inicial?: number | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          data_reposicao?: string | null
          dias_antecedencia_reposicao?: number | null
          dosagem?: string
          frequencia_numero?: number | null
          frequencia_unidade?: string | null
          horario_inicio?: string | null
          id?: string
          limite_reabastecimento?: number | null
          nome_medicamento?: string
          quantidade_atual?: number | null
          quantidade_embalagem?: number | null
          quantidade_inicial?: number | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alergias: string | null
          condicoes_medicas: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_telefone: string | null
          created_at: string
          data_nascimento: string | null
          email: string
          id: string
          nome: string
          tipo_perfil: Database["public"]["Enums"]["tipo_perfil"] | null
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          condicoes_medicas?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          created_at?: string
          data_nascimento?: string | null
          email: string
          id: string
          nome: string
          tipo_perfil?: Database["public"]["Enums"]["tipo_perfil"] | null
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          condicoes_medicas?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string
          id?: string
          nome?: string
          tipo_perfil?: Database["public"]["Enums"]["tipo_perfil"] | null
          updated_at?: string
        }
        Relationships: []
      }
      registros_tomada: {
        Row: {
          created_at: string
          data_hora_prevista: string
          data_hora_realizada: string | null
          id: string
          medicamento_id: string
          status: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_hora_prevista: string
          data_hora_realizada?: string | null
          id?: string
          medicamento_id: string
          status?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_hora_prevista?: string
          data_hora_realizada?: string | null
          id?: string
          medicamento_id?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_tomada_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_tomada_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relacionamento_cuidador: {
        Row: {
          cuidador_id: string
          data_vinculo: string
          id: string
          idoso_id: string
        }
        Insert: {
          cuidador_id: string
          data_vinculo?: string
          id?: string
          idoso_id: string
        }
        Update: {
          cuidador_id?: string
          data_vinculo?: string
          id?: string
          idoso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relacionamento_cuidador_cuidador_id_fkey"
            columns: ["cuidador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relacionamento_cuidador_idoso_id_fkey"
            columns: ["idoso_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_perfil: "idoso" | "cuidador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_perfil: ["idoso", "cuidador"],
    },
  },
} as const
