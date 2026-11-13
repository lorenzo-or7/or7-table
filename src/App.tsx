import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { homeFor, useAuth } from '@/lib/auth'
import type { Role } from '@/lib/types'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Logo } from '@/components/brand/Logo'
import { Button, ButtonLink } from '@/components/ui/primitives'
import { FullScreenLoader } from '@/components/ui/FullScreenLoader'
import { BootScreen } from '@/components/ui/BootScreen'
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary'
import { bootMark, isShellPath, useBoot } from '@/lib/boot'

const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/auth/Login'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const MfaVerify = lazy(() => import('@/pages/auth/MfaVerify'))
const PublicMenuPage = lazy(() => import('@/pages/PublicMenuPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Legal = lazy(() => import('@/pages/Legal'))

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminOverview = lazy(() => import('@/pages/admin/Overview'))
const AdminEstablishments = lazy(() => import('@/pages/admin/Establishments'))
const AdminUsers = lazy(() => import('@/pages/admin/Users'))
const AdminMenus = lazy(() => import('@/pages/admin/Menus'))
const AdminQrCodes = lazy(() => import('@/pages/admin/QrCodes'))
const AdminAnalytics = lazy(() => import('@/pages/admin/Analytics'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))
const AdminFinance = lazy(() => import('@/pages/admin/Finance'))

const OwnerLayout = lazy(() => import('@/pages/owner/OwnerLayout'))
const OwnerHome = lazy(() => import('@/pages/owner/OwnerHome'))
const OwnerProducts = lazy(() => import('@/pages/owner/OwnerProducts'))
const OwnerCategories = lazy(() => import('@/pages/owner/OwnerCategories'))
const OwnerPhotos = lazy(() => import('@/pages/owner/OwnerPhotos'))

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

/** Tela de carregamento: só no primeiro carregamento de uma rota do shell (login/painéis). */
function BootGate() {
  const { pathname } = useLocation()
  const [active] = useState(() => isShellPath(pathname))
  const boot = useBoot()
  useEffect(() => bootMark('shell'), [])
  return <AnimatePresence>{active && !boot.finished && <BootScreen key="boot" />}</AnimatePresence>
}

/** Marca a etapa "tela pronta" quando o código da rota carregou e ela foi exibida. */
function Ready({ children }: { children: ReactNode }) {
  useEffect(() => bootMark('route'), [])
  return <>{children}</>
}

/** Enquanto o código de uma rota carrega: nada de logo Or7 nos cardápios dos restaurantes. */
function RouteFallback() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/table/')) return <div className="min-h-dvh" aria-busy="true" />
  if (isShellPath(pathname)) return <FullScreenLoader />
  return <div className="min-h-dvh bg-abyss" aria-busy="true" />
}

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, profile, loading, mfa, refreshProfile, signOut } = useAuth()
  const location = useLocation()
  const [retried, setRetried] = useState(false)

  useEffect(() => {
    if (session && mfa === 'ok' && !profile && !loading && !retried) {
      refreshProfile().finally(() => setRetried(true))
    }
  }, [session, mfa, profile, loading, retried, refreshProfile])

  if (!isSupabaseConfigured) return <Navigate to="/entrar" replace />
  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  // senha sem segundo fator (aal1) não abre painel nenhum: vai para a verificação e volta ao destino
  if (mfa !== 'ok') return <Navigate to="/verificacao" replace state={{ from: location.pathname }} />
  if (!profile) {
    if (!retried) return <FullScreenLoader />
    return (
      <Ready>
      <AccessIssue
        title="Perfil não encontrado"
        text="Sua conta existe, mas ainda não tem um perfil de acesso. Fale com a equipe Or7 para concluir a liberação."
        onSignOut={signOut}
      />
      </Ready>
    )
  }
  if (profile.role !== role) return <Navigate to={homeFor(profile)} replace />
  if (role === 'owner' && !profile.establishment_id) {
    return (
      <Ready>
      <AccessIssue
        title="Acesso ainda não liberado"
        text="Seu login funciona, mas nenhum estabelecimento foi vinculado à sua conta. Assim que a equipe Or7 fizer o vínculo, é só entrar de novo."
        onSignOut={signOut}
      />
      </Ready>
    )
  }
  return <Ready>{children}</Ready>
}

function AccessIssue({ title, text, onSignOut }: { title: string; text: string; onSignOut: () => Promise<void> }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-abyss px-6">
      <div className="max-w-md text-center">
        <Logo variant="icon" className="mx-auto w-14" />
        <h1 className="mt-8 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 leading-relaxed text-mist">{text}</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink to="/" variant="secondary">
            Ir para o site
          </ButtonLink>
          <Button variant="ghost" onClick={() => onSignOut()}>
            Sair
          </Button>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
    <BootGate />
    <Suspense fallback={<RouteFallback />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<Ready><Login /></Ready>} />
        <Route path="/login" element={<Navigate to="/entrar" replace />} />
        <Route path="/redefinir-senha" element={<Ready><ResetPassword /></Ready>} />
        <Route path="/verificacao" element={<Ready><MfaVerify /></Ready>} />
        <Route path="/table/:slug" element={<PublicMenuPage />} />
        <Route path="/privacidade" element={<Legal />} />
        <Route path="/cookies" element={<Legal />} />
        <Route path="/termos" element={<Legal />} />

        <Route
          path="/admin"
          element={
            <RequireRole role="super_admin">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="estabelecimentos" element={<AdminEstablishments />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="cardapios" element={<AdminMenus />} />
          <Route path="qr-codes" element={<AdminQrCodes />} />
          <Route path="financeiro" element={<AdminFinance />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="configuracoes" element={<AdminSettings />} />
        </Route>

        <Route
          path="/painel"
          element={
            <RequireRole role="owner">
              <OwnerLayout />
            </RequireRole>
          }
        >
          <Route index element={<OwnerHome />} />
          <Route path="produtos" element={<OwnerProducts />} />
          <Route path="categorias" element={<OwnerCategories />} />
          <Route path="fotografias" element={<OwnerPhotos />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    </AppErrorBoundary>
  )
}
