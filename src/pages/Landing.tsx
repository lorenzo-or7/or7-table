import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { DemoSection } from '@/components/landing/DemoSection'
import { Benefits } from '@/components/landing/Benefits'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Personalization } from '@/components/landing/Personalization'
import { QrSection } from '@/components/landing/QrSection'
import { Plans } from '@/components/landing/Plans'
import { Faq } from '@/components/landing/Faq'
import { FinalCta, Footer } from '@/components/landing/Footer'

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-abyss">
      <a
        href="#conteudo"
        className="sr-only z-[100] rounded-full bg-gold px-4 py-2 text-navy-950 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo">
        <Hero />
        <DemoSection />
        <Benefits />
        <HowItWorks />
        <Personalization />
        <QrSection />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
