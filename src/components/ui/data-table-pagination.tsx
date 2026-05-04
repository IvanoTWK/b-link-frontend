import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DataTablePaginationProps {
  currentPage: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

export function DataTablePagination({
  currentPage,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">Pagina {currentPage}</span>
      <Button variant="outline" size="icon" onClick={onPrevious} disabled={!hasPrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onNext} disabled={!hasNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
