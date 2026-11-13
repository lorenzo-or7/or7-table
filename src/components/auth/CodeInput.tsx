import { useEffect, useRef, useState } from 'react'
import { cn } from '@/components/ui/primitives'

/**
 * Código de 6 dígitos. Um único <input> real (colar, autocompletar do SMS/Authenticator, leitor de tela e
 * teclado funcionam do jeito nativo) desenhado como seis casas.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  describedBy,
  autoFocus,
  label = 'Código de 6 dígitos',
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  invalid?: boolean
  disabled?: boolean
  describedBy?: string
  autoFocus?: boolean
  label?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const active = Math.min(value.length, 5)
  // depois de um código recusado, o cursor volta para o campo (teclado e leitor de tela)
  useEffect(() => {
    if (invalid && !disabled) ref.current?.focus()
  }, [invalid, disabled])

  return (
    <div className="relative" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
          onChange(digits)
          if (digits.length === 6) onComplete?.(digits)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        autoFocus={autoFocus}
        spellCheck={false}
        className="absolute inset-0 z-10 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
      />
      <div aria-hidden className="grid grid-cols-6 gap-2 sm:gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => {
          const char = value[i] ?? ''
          const isActive = focused && i === active && !disabled
          return (
            <span
              key={i}
              className={cn(
                'grid h-[58px] place-items-center rounded-[10px] border bg-navy-950/80 font-[family-name:var(--font-ui)] text-[1.6rem] font-semibold text-cream tabular transition-[border-color,box-shadow] duration-200 sm:h-[62px]',
                invalid ? 'border-red-soft/60' : isActive ? 'border-gold/70 shadow-[0_0_0_3px_rgb(255_170_0/0.14)]' : char ? 'border-white/20' : 'border-white/10',
              )}
            >
              {char || (isActive ? <span className="h-6 w-px animate-pulse bg-gold motion-reduce:animate-none" /> : '')}
            </span>
          )
        })}
      </div>
    </div>
  )
}
