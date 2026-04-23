"use client"

import { GalleryVerticalEnd } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain() {

  const isMobile = useIsMobile()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="w-full flex items-center gap-2">
        <GalleryVerticalEnd className="w-5 h-5" />
        {!isMobile && <span className="font-semibold text-lg tracking-tight">B-Link</span>}
      </SidebarMenuItem>

    </SidebarMenu>
  )
}
