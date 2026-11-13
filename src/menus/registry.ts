/**
 * Registro dos cardápios exclusivos.
 *
 * Como criar o cardápio de um novo cliente:
 *  1. Crie a pasta src/menus/<chave>/ com um componente React que receba
 *     `MenuThemeProps` (src/lib/public-menu.ts). Layout, fontes, cores e
 *     animações são livres — cada cliente tem o seu.
 *  2. Registre a chave abaixo.
 *  3. No painel Super Admin → Estabelecimentos, escolha essa identidade.
 *  O endereço /table/<slug> passa a usar o novo componente, com os dados
 *  que o proprietário edita no painel. O QR Code continua o mesmo.
 *
 * Cardápio hospedado fora deste projeto: preencha "URL externa" no
 * estabelecimento e consuma os dados como descrito em src/lib/public-menu.ts.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { MenuThemeProps } from '@/lib/public-menu'

interface MenuTheme {
  label: string
  description: string
  component: LazyExoticComponent<ComponentType<MenuThemeProps>>
}

export const menuThemes: Record<string, MenuTheme> = {
  'casa-mare': {
    label: 'Casa Maré',
    description: 'Identidade da demonstração (restaurante fictício).',
    component: lazy(() => import('./casa-mare/CasaMareMenu')),
  },
  'la-brasa': {
    label: 'La Brasa',
    description: 'Identidade da hamburgueria La Brasa (cardápio demonstrativo).',
    component: lazy(() => import('./la-brasa/LaBrasaMenu')),
  },
  starbucks: {
    label: 'Starbucks (demonstração não oficial)',
    description: 'Cafeteria editorial com hero cinematográfica e preços por tamanho.',
    component: lazy(() => import('./starbucks/StarbucksMenu')),
  },
  base: {
    label: 'Base provisória',
    description: 'Layout neutro, usado enquanto a identidade exclusiva está em produção.',
    component: lazy(() => import('./base/BaseMenu')),
  },
}

export function resolveTheme(key: string | null | undefined): MenuTheme {
  return (key && menuThemes[key]) || menuThemes.base!
}
