export type Role = 'super_admin' | 'owner'

export interface Establishment {
  id: string
  name: string
  slug: string
  is_active: boolean
  theme_key: string
  external_url: string | null
  tagline: string | null
  address: string | null
  opening_hours: string | null
  instagram: string | null
  logo_path: string | null
  created_at: string
  updated_at: string
}

export interface Billing {
  establishment_id: string
  monthly_fee: number
  notes: string | null
  contract_start?: string | null
  due_day?: number | null
}

/** Mensalidade efetivamente recebida, lançada manualmente pela Or7 (migração 0003). */
export interface Payment {
  id: string
  establishment_id: string
  reference_month: string
  amount: number
  paid_at: string
  method: PaymentMethod | null
  notes: string | null
  created_at: string
}

export type PaymentMethod = 'pix' | 'boleto' | 'transferencia' | 'cartao' | 'dinheiro' | 'outro'

/** Perfil + dados de acesso de auth.users (somente Super Admin, via admin_accounts()). */
export interface Account extends Profile {
  invited_at: string | null
  confirmed_at: string | null
  last_sign_in_at: string | null
  /** Authenticator (TOTP) confirmado — migração 0004 */
  mfa_enabled?: boolean
}

export interface SecurityEvent {
  id: number
  created_at: string
  actor_id: string | null
  target_id: string | null
  event: 'mfa_enrolled' | 'mfa_challenge_failed' | 'mfa_verified' | 'mfa_reset_by_admin' | 'mfa_reset_denied'
  details: Record<string, unknown>
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  establishment_id: string | null
  created_at: string
}

export interface OwnerInvite {
  id: string
  email: string
  full_name: string | null
  establishment_id: string
  created_at: string
  accepted_at: string | null
  expires_at?: string | null
}

export interface Category {
  id: string
  establishment_id: string
  name: string
  position: number
  created_at: string
}

/** Preço por tamanho (ex.: Tall 300 ml). Quando existe, price = menor preço. */
export interface ProductVariant {
  label: string
  volume_ml?: number | null
  price: number
}

export interface Product {
  id: string
  establishment_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  variants?: ProductVariant[] | null
  image_path: string | null
  is_available: boolean
  is_featured?: boolean
  position: number
  created_at: string
  updated_at: string
}
