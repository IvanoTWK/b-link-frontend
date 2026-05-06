"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
  Building2,
  Droplets,
  FlaskConical,
  ClipboardList,
  ScrollText,
  ShieldCheck,
} from "lucide-react"

import { useAuthStore } from "@/lib/store/auth.store"
import { apiClient } from "@/lib/api/axios"
import { LogoutConfirmDialog } from "@/components/ui/logout-confirm-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const NAV_MAIN = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Utenti", icon: Users, exact: false },
  { href: "/admin/profile", label: "Profilo", icon: UserRound, exact: false },
]

const NAV_GESTIONE = [
  { href: "/admin/centers", label: "Centri", icon: Building2, exact: false },
  { href: "/admin/donation-types", label: "Tipi donazione", icon: Droplets, exact: false },
  { href: "/admin/exam-parameters", label: "Parametri lab", icon: FlaskConical, exact: false },
  { href: "/admin/anamnesis", label: "Domande anamnesi", icon: ClipboardList, exact: false },
]

const NAV_SISTEMA = [
  { href: "/admin/audit-logs", label: "Audit log", icon: ScrollText, exact: false },
  { href: "/admin/consensi", label: "Consensi", icon: ShieldCheck, exact: false },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignora errori — il cookie scade lato server
    } finally {
      logout()
      router.replace('/auth/login')
    }
  }

  const isActive = (item: { href: string; exact: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Sidebar {...props}>
      {/* Header — logo */}
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <Image src="/b-link.svg" alt="B-Link" width={32} height={32} className="rounded-lg shrink-0" />
                <span className="font-semibold text-lg tracking-tight">B-Link</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content — navigazione */}
      <SidebarContent>
        {/* Principale */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MAIN.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    size="lg"
                    asChild
                    isActive={isActive(item)}
                    className="[&_svg]:size-5 font-semibold text-base tracking-tight"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Gestione */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-4 py-1">
            Gestione
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_GESTIONE.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    size="lg"
                    asChild
                    isActive={isActive(item)}
                    className="[&_svg]:size-5 font-semibold text-base tracking-tight"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Sistema */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-4 py-1">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_SISTEMA.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    size="lg"
                    asChild
                    isActive={isActive(item)}
                    className="[&_svg]:size-5 font-semibold text-base tracking-tight"
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — logout */}
      <SidebarFooter className="p-0">
        <SidebarSeparator className="mx-0 mb-0" />
        <div className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <LogoutConfirmDialog
                onConfirm={handleLogout}
                trigger={
                  <SidebarMenuButton
                    size="lg"
                    className="[&_svg]:size-5 font-semibold text-base tracking-tight"
                  >
                    <LogOut />
                    <span>Esci</span>
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
