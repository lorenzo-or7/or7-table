import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/components/ui/primitives'

const ease = [0.22, 1, 0.36, 1] as const

/** Revela palavra por palavra (desfoque → nítido), como os títulos da referência. */
export function WordReveal({
  text,
  className,
  delay = 0,
  as: Tag = 'span',
  stagger = 0.06,
  once = true,
  immediate = false,
}: {
  text: string
  className?: string
  delay?: number
  as?: 'span' | 'h1' | 'h2' | 'p'
  stagger?: number
  once?: boolean
  immediate?: boolean
}) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  const MotionTag = motion[Tag]
  if (reduce) return <Tag className={className}>{text}</Tag>
  return (
    <MotionTag
      className={className}
      initial="hidden"
      {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once, margin: '0px 0px -12% 0px' } })}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          aria-hidden
          className="inline-block whitespace-pre"
          variants={{
            hidden: immediate ? { opacity: 0, y: '0.35em', filter: 'blur(10px)' } : { opacity: 0, y: '0.4em' },
            show: immediate
              ? { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease } }
              : { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
          }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </MotionTag>
  )
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'eyebrow inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-mist shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-gold" aria-hidden />
      {children}
    </span>
  )
}

/** Cabeçalho de seção: rótulo-pílula + título Tanker em dois tons. */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = 'center',
  className,
  id,
}: {
  eyebrow: string
  title: string
  accent?: string
  description?: ReactNode
  align?: 'center' | 'left'
  className?: string
  id?: string
}) {
  return (
    <div className={cn('flex flex-col', align === 'center' ? 'items-center text-center' : 'items-start text-left', className)}>
      <Reveal y={12}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <h2 id={id} className="display mt-6 text-[2.6rem] text-cream sm:text-6xl lg:text-[4.6rem]">
        <WordReveal text={title} />
        {accent && (
          <>
            <br />
            <WordReveal text={accent} className="text-mist/55" delay={0.15} />
          </>
        )}
      </h2>
      {description && (
        <Reveal delay={0.15} className={cn('mt-6 max-w-xl text-[1.05rem] leading-relaxed text-mist', align === 'center' && 'mx-auto')}>
          {description}
        </Reveal>
      )}
    </div>
  )
}

/** Moldura de smartphone; o conteúdo rola dentro da tela. */
export function PhoneFrame({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div
      className={cn(
        'relative aspect-[9/19.2] w-[300px] rounded-[46px] bg-[#0a0d1f] p-[10px] shadow-[0_0_0_1px_rgb(255_255_255/0.09),0_0_0_9px_#11173a,0_0_0_10px_rgb(255_255_255/0.06),0_50px_120px_-30px_rgb(0_0_0/0.9)]',
        className,
      )}
      role={label ? 'region' : undefined}
      aria-label={label}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[37px] bg-black [transform:translateZ(0)]">
        <div
          className="pointer-events-none absolute top-2 left-1/2 z-40 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black"
          aria-hidden
        />
        {children}
      </div>
    </div>
  )
}

export const Container = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('mx-auto w-full max-w-[1240px] px-5 sm:px-8', className)}>{children}</div>
)
