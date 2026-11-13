import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Footer } from '@/components/landing/Footer'
import { cn } from '@/components/ui/primitives'
import { CONTACT_EMAIL, WHATSAPP_DISPLAY } from '@/lib/site'

type Section = { title: string; body: Array<string | string[]> }
type Doc = { title: string; intro: string; sections: Section[] }

const contact = `pelo WhatsApp ${WHATSAPP_DISPLAY}${CONTACT_EMAIL ? ` ou pelo e-mail ${CONTACT_EMAIL}` : ''}`

const docs: Record<string, Doc> = {
  privacidade: {
    title: 'Política de Privacidade',
    intro: 'Como o Or7 Table, produto da Or7.dev, trata os dados de quem visita o site, de quem consulta os cardápios e de quem administra um estabelecimento.',
    sections: [
      {
        title: 'Dados que tratamos',
        body: [
          [
            'Clientes que abrem um cardápio: não pedimos cadastro. Registramos apenas uma contagem anônima de visualização (data, horário e se o acesso veio pelo QR Code ou por link), sem nome, IP ou identificador pessoal.',
            'Administradores e proprietários: nome, e-mail, senha (guardada de forma criptografada pelo provedor de autenticação) e o estabelecimento vinculado à conta.',
            'Conteúdo dos cardápios: produtos, preços, descrições e fotos, que são informações públicas do próprio estabelecimento.',
            'Contato comercial: conversas pelo WhatsApp acontecem no aplicativo e seguem as regras dele.',
          ],
        ],
      },
      {
        title: 'Para que usamos',
        body: ['Para exibir os cardápios, dar acesso ao painel, prestar suporte, cumprir o contrato com o estabelecimento e entender, de forma agregada, quantas vezes cada cardápio foi aberto.'],
      },
      {
        title: 'Onde os dados ficam',
        body: ['Banco de dados, autenticação e fotos ficam na infraestrutura do Supabase. O site é servido pela hospedagem da Or7. Não vendemos nem cedemos dados a terceiros para publicidade.'],
      },
      {
        title: 'Seus direitos (LGPD)',
        body: [`Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, além de informações sobre o tratamento, ${contact}.`],
      },
      {
        title: 'Por quanto tempo guardamos',
        body: ['Dados de acesso ao painel ficam enquanto a conta existir. Ao fim do contrato, a conta e o conteúdo do estabelecimento podem ser excluídos mediante pedido. A contagem anônima de visualizações pode ser mantida para histórico.'],
      },
    ],
  },
  cookies: {
    title: 'Política de Cookies',
    intro: 'O Or7 Table não usa cookies de publicidade nem ferramentas de rastreamento de terceiros.',
    sections: [
      {
        title: 'O que fica guardado no seu navegador',
        body: [
          [
            'Sessão do painel: quem entra como administrador tem a sessão guardada no navegador para continuar conectado. Se “Manter conectado” estiver desligado, ela some ao fechar a aba.',
            'Visita ao cardápio: guardamos, só durante a aba aberta, um sinal de que o cardápio já foi contado, para não registrar a mesma visita duas vezes.',
          ],
        ],
      },
      {
        title: 'Serviços externos',
        body: ['Algumas fontes tipográficas e fotos dos cardápios demonstrativos são carregadas de serviços externos (Fontshare, Google Fonts e Unsplash). Como em qualquer site, esses serviços recebem dados técnicos da requisição, como o endereço IP.'],
      },
      {
        title: 'Como controlar',
        body: ['Você pode apagar os dados do site nas configurações do navegador a qualquer momento. Isso apenas desconecta o painel; os cardápios continuam funcionando normalmente.'],
      },
    ],
  },
  termos: {
    title: 'Termos de Uso',
    intro: 'Regras para usar o Or7 Table, seja como cliente que consulta um cardápio ou como estabelecimento contratante.',
    sections: [
      {
        title: 'O serviço',
        body: ['O Or7 Table é uma plataforma de cardápios digitais para consulta, acessados por QR Code ou link. Não processa pedidos, reservas nem pagamentos.'],
      },
      {
        title: 'Acesso ao painel',
        body: ['Contas de administrador são criadas pela equipe Or7, não há cadastro aberto. As credenciais são pessoais, e o titular responde pelo sigilo da própria senha.'],
      },
      {
        title: 'Conteúdo publicado',
        body: [
          'O estabelecimento é responsável pelas informações que publica no cardápio, incluindo preços, descrições, disponibilidade e direitos de uso das fotos. Informações sobre ingredientes e alérgenos devem ser confirmadas com o estabelecimento.',
        ],
      },
      {
        title: 'Contratação',
        body: ['A contratação reúne uma implantação, paga uma vez, e uma mensalidade, nas condições combinadas na proposta comercial.'],
      },
      {
        title: 'Propriedade intelectual',
        body: ['A plataforma e o layout desenvolvido pela Or7 pertencem à Or7. Marcas, logos, fotos e textos do estabelecimento continuam sendo dele.'],
      },
      {
        title: 'Uso indevido e alterações',
        body: [`É proibido tentar acessar dados de outros estabelecimentos ou comprometer o funcionamento do serviço. Estes termos podem ser atualizados; dúvidas ${contact}.`],
      },
    ],
  },
}

export default function Legal() {
  const { pathname } = useLocation()
  const key = pathname.replace('/', '') as keyof typeof docs
  const doc = docs[key] ?? docs.privacidade!

  useEffect(() => {
    document.title = `${doc.title} · Or7 Table`
    return () => {
      document.title = 'Or7 Table — Cardápios digitais exclusivos por QR Code'
    }
  }, [doc.title])

  return (
    <div className="min-h-dvh bg-abyss">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="Or7 Table — início">
            <Logo variant="horizontal" className="h-8 w-auto" priority />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-mist hover:text-cream">
            <ArrowLeft className="size-4" aria-hidden /> Voltar ao site
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:py-20">
        <nav aria-label="Documentos legais" className="lg:sticky lg:top-10 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {Object.entries(docs).map(([slug, d]) => (
              <li key={slug}>
                <NavLink
                  to={`/${slug}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-[4px] border px-3 py-2 text-sm transition-colors',
                      isActive ? 'border-white/12 bg-white/[0.04] text-cream' : 'border-white/[0.06] text-mist hover:border-white/12 hover:text-cream lg:border-transparent',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span aria-hidden className={cn('size-1.5 shrink-0 transition-colors', isActive ? 'bg-gold' : 'bg-white/15')} />
                      {d.title}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl">
          <p className="eyebrow text-gold">Documentos · atualizado em novembro de 2026</p>
          <h1 className="display mt-4 text-5xl text-cream sm:text-6xl">{doc.title}</h1>
          <p className="mt-5 text-[1.08rem] leading-relaxed text-mist">{doc.intro}</p>
          <div className="mt-12 grid gap-10">
            {doc.sections.map((s, i) => (
              <section key={s.title} aria-labelledby={`legal-${i}`}>
                <h2 id={`legal-${i}`} className="flex items-baseline gap-3 text-xl font-semibold text-cream">
                  <span className="font-[family-name:var(--font-ui)] text-xs text-gold tabular">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h2>
                {s.body.map((b, j) =>
                  Array.isArray(b) ? (
                    <ul key={j} className="mt-4 grid gap-3">
                      {b.map((item) => (
                        <li key={item} className="flex gap-3 leading-relaxed text-mist">
                          <span className="mt-2.5 size-1.5 shrink-0 bg-gold" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j} className="mt-4 leading-relaxed text-mist">
                      {b}
                    </p>
                  ),
                )}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
