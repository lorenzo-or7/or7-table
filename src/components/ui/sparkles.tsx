/**
 * SparklesCore — adaptação do componente Aceternity para tsParticles v4.
 * Mesmo comportamento do original (densidade, opacidade cintilante,
 * movimento lento, "push" ao clicar, fade-in quando carrega), com:
 *  - paleta Or7 Table (pontos brancos e dourados);
 *  - pausa fora da viewport;
 *  - prefers-reduced-motion: partículas estáticas, sem cintilar.
 */
import { memo, useId, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Particles, ParticlesProvider } from '@tsparticles/react'
import type { Container, Engine, ISourceOptions } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import { cn } from './primitives'

type SparklesProps = {
  id?: string
  className?: string
  background?: string
  minSize?: number
  maxSize?: number
  speed?: number
  particleColor?: string | string[]
  particleDensity?: number
}

const DEFAULT_COLORS = ['#ffffff', '#FFC64D']

// precisa ser estável durante todo o ciclo de vida do app
const initEngine = async (engine: Engine) => {
  await loadSlim(engine)
}

function SparklesCoreImpl({
  id,
  className,
  background = 'transparent',
  minSize = 0.4,
  maxSize = 1.4,
  speed = 2.2,
  particleColor = DEFAULT_COLORS,
  particleDensity = 70,
}: SparklesProps) {
  const generatedId = useId()
  const reduce = useReducedMotion()
  const [ready, setReady] = useState(false)

  // memoizado: um objeto novo a cada render faria o motor recarregar as partículas
  const options: ISourceOptions = useMemo(() => ({
    background: { color: { value: background } },
    fullScreen: { enable: false, zIndex: 1 },
    fpsLimit: 30,
    pauseOnOutsideViewport: true,
    pauseOnBlur: true,
    interactivity: {
      events: {
        onClick: { enable: !reduce, mode: 'push' },
        onHover: { enable: false, mode: 'repulse' },
        resize: { enable: true },
      },
      modes: { push: { quantity: 2 }, repulse: { distance: 200, duration: 0.4 } },
    },
    particles: {
      color: { value: particleColor },
      move: {
        enable: !reduce,
        direction: 'none',
        outModes: { default: 'out' },
        random: false,
        speed: { min: 0.05, max: 0.45 },
        straight: false,
      },
      number: { density: { enable: true, width: 400, height: 400 }, value: particleDensity },
      opacity: {
        value: { min: 0.08, max: 0.9 },
        animation: { enable: !reduce, speed, sync: false, startValue: 'random', destroy: 'none' },
      },
      shape: { type: 'circle' },
      size: { value: { min: minSize, max: maxSize } },
    },
    // sem retina: em telas 2x o canvas quadruplicava de tamanho sem ganho visível
    detectRetina: false,
  }), [background, maxSize, minSize, particleColor, particleDensity, reduce, speed])

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className={cn('pointer-events-auto', className)}
    >
      <ParticlesProvider init={initEngine}>
        <Particles
          id={id || generatedId}
          className="h-full w-full"
          options={options}
          particlesLoaded={async (container?: Container) => {
            if (container) setReady(true)
          }}
        />
      </ParticlesProvider>
    </motion.div>
  )
}

export const SparklesCore = memo(SparklesCoreImpl)

export default SparklesCore
