"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, UserRound, Users } from "lucide-react"

import { useAuthStore } from "@/lib/store/auth.store"
import { apiClient } from "@/lib/api/axios"
import { LogoutConfirmDialog } from "@/components/ui/logout-confirm-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const NAV_ITEMS = [
  { href: "/doctors", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/doctors/anamnesis", label: "Questionari", icon: ClipboardList, exact: false },
  { href: "/doctors/donors", label: "Donatori", icon: Users, exact: false },
  { href: "/doctors/reports", label: "Referti", icon: CalendarDays, exact: false },
  { href: "/doctors/profile", label: "Profilo", icon: UserRound, exact: false },
]

export function DoctorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

  return (
    <Sidebar {...props}>
      {/* Header — logo */}
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/doctors">
                <Image src="/b-link.svg" alt="B-Link" width={32} height={32} className="rounded-lg shrink-0" />
                <span className="font-semibold text-lg tracking-tight">B-Link</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content — navigazione */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      size="lg"
                      asChild
                      isActive={isActive}
                      className="[&_svg]:size-5 font-semibold text-base tracking-tight"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
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
