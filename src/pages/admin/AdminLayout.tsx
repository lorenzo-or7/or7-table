import { ChartNoAxesColumn, HandCoins, LayoutDashboard, QrCode, Settings, Store, UsersRound, UtensilsCrossed } from 'lucide-react'
import { PanelLayout } from '@/components/panel/PanelLayout'

export default function AdminLayout() {
  return (
    <PanelLayout
      home="/admin"
      subtitle="Super Admin · Or7"
      links={[
        { label: 'Visão geral', href: '/admin', icon: <LayoutDashboard />, end: true },
        { label: 'Estabelecimentos', href: '/admin/estabelecimentos', icon: <Store /> },
        { label: 'Usuários e acessos', href: '/admin/usuarios', icon: <UsersRound /> },
        { label: 'Cardápios', href: '/admin/cardapios', icon: <UtensilsCrossed /> },
        { label: 'QR Codes', href: '/admin/qr-codes', icon: <QrCode /> },
        { label: 'Financeiro', href: '/admin/financeiro', icon: <HandCoins /> },
        { label: 'Analytics', href: '/admin/analytics', icon: <ChartNoAxesColumn /> },
        { label: 'Configurações', href: '/admin/configuracoes', icon: <Settings /> },
      ]}
    />
  )
}
