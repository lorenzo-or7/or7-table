import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link, type LinkProps } from 'react-router'
import { LoaderCircle } from 'lucide-react'

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ Button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light'
type Size = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_10px_30px_-12px_rgb(255_170_0/0.6)] hover:bg-gold-soft',
  secondary:
    'border border-white/12 bg-white/[0.06] text-cream shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-md hover:border-white/20 hover:bg-white/[0.1]',
  ghost: 'text-mist hover:bg-white/[0.06] hover:text-cream',
  danger: 'bg-red text-white hover:bg-red-soft',
  light: 'bg-cream text-navy-950 shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)] hover:bg-white',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-13 px-7 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function ButtonLink({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

export function ButtonAnchor({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </a>
  )
}

export function IconButton({
  label,
  className,
  children,
  tone = 'default',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-mist transition-colors duration-150 hover:bg-white/[0.07] hover:text-cream disabled:pointer-events-none disabled:opacity-40',
        tone === 'danger' && 'hover:bg-red/15 hover:text-red-soft',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ Fields */

const control =
  'w-full rounded-xl border border-white/10 bg-navy-950/70 px-3.5 text-[0.95rem] text-cream placeholder:text-dim/80 transition-[border-color,box-shadow] duration-150 outline-none hover:border-white/18 focus:border-gold/70 focus:shadow-[0_0_0_3px_rgb(255_170_0/0.15)] aria-[invalid=true]:border-red-soft/70 disabled:opacity-60'

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string | null
  children: (id: string, describedBy: string | undefined) => ReactNode
  className?: string
  optional?: boolean
}

export function Field({ label, hint, error, children, className, optional }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-cream/90">
        {label}
        {optional && <span className="text-xs font-normal text-dim">opcional</span>}
      </label>
      {children(id, describedBy)}
      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-dim">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-soft">
          {error}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(control, 'h-11', className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cn(control, 'min-h-24 resize-y py-2.5 leading-relaxed', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, 'h-11 appearance-none pr-10', className)} {...rest}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 fill-none stroke-mist"
        strokeWidth="1.6"
      >
        <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
})

/* ------------------------------------------------------------------ Switch */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-200 disabled:opacity-50',
        size === 'md' ? 'h-7 w-12' : 'h-6 w-10',
        checked ? 'border-gold/60 bg-gold' : 'border-white/12 bg-white/[0.08]',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'block rounded-full shadow-md transition-transform duration-200 ease-[var(--ease-out-quint)]',
          size === 'md' ? 'size-5' : 'size-4',
          checked
            ? cn('bg-navy-950', size === 'md' ? 'translate-x-6' : 'translate-x-5')
            : 'translate-x-1 bg-mist',
        )}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ Misc */

export function Spinner({ className, label = 'Carregando' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-mist', className)}>
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'gold' | 'red' | 'mint'
  className?: string
}) {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.05] text-mist',
    gold: 'border-gold/30 bg-gold/10 text-gold-soft',
    red: 'border-red/30 bg-red/10 text-red-soft',
    mint: 'border-mint/25 bg-mint/10 text-mint',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-5 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-gold">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-cream">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-mist">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-2xl border border-white/[0.07] bg-navy-900/80', className)}>{children}</section>
}
