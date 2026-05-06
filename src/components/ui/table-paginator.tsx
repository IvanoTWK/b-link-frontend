'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TablePaginatorProps {
  page: number             // 0-indexed
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizes?: number[]
}

export function TablePaginator({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 20, 50],
}: TablePaginatorProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 0
  const canNext = page < totalPages - 1

  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Selezione dimensione pagina */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Righe per pagina</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v))
            onPageChange(0)
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizes.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info + navigazione */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">
          {total === 0 ? '0 risultati' : `${start}–${end} di ${total}`}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(0)}
            disabled={!canPrev}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={!canNext}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
