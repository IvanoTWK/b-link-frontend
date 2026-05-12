'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building, CalendarDays, Check, ChevronLeft, ChevronRight, ChevronsUpDown, Clock, Droplets, FlaskConical, Info, Layers, Microscope } from 'lucide-react'
import dynamic from 'next/dynamic'

import { apiClient } from '@/lib/api/axios'
import type { Center, DonationType, Slot } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'

// Leaflet richiede window → import dinamico senza SSR
const CenterMap = dynamic(
  () => import('@/components/donors/bookings/center-map'),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
)

// ── Tipi ──────────────────────────────────────────────────────────────────────

interface PaginatedCenters {
  items: Center[]
  nextCursor: string | null
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchDonationTypes(): Promise<DonationType[]> {
  const { data } = await apiClient.get<DonationType[]>('/donation-types')
  return data.filter((d) => d.isActive)
}

async function fetchCenters(): Promise<Center[]> {
  const { data } = await apiClient.get<PaginatedCenters>('/centers', {
    params: { limit: 100 },
  })
  return data.items.filter((c) => c.isActive)
}

async function fetchSlots(centerId: string, donationTypeId: string): Promise<Slot[]> {
  const { data } = await apiClient.get<Slot[]>('/slots', {
    params: { centerId, donationTypeId },
  })
  return data
}

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEPS = ['Tipo donazione', 'Centro e orario', 'Conferma']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border
                ${done ? 'bg-primary border-primary text-primary-foreground' : ''}
                ${active ? 'border-primary text-primary' : ''}
                ${!done && !active ? 'border-border text-muted-foreground' : ''}
              `}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-sm ${active ? 'font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-4 h-px w-10 bg-border" />
            )}
          </div>
        )
      })}
    </div>
  )
}



// ── Step 1: Tipo donazione ────────────────────────────────────────────────────

function StepDonationType({
  selected,
  onSelect,
}: {
  selected: DonationType | null
  onSelect: (d: DonationType) => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['donation-types'],
    queryFn: fetchDonationTypes,
  })

  const TYPE_CONFIG: Record<string, {
    iconComponent: React.ElementType
    description: string
    gradient: string
  }> = {
    SI: {
      iconComponent: Droplets,
      description: 'La donazione più diffusa. Globuli rossi, plasma e piastrine aiutano più pazienti con una sola donazione.',
      gradient: 'from-red-400 via-rose-500 to-pink-700',
    },
    PL: {
      iconComponent: FlaskConical,
      description: 'Il plasma viene raccolto tramite aferesi. Usato per farmaci salvavita e terapie d\'emergenza.',
      gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    },
    PT: {
      iconComponent: Microscope,
      description: 'Fondamentali per i pazienti oncologici in chemioterapia e per i disturbi della coagulazione.',
      gradient: 'from-cyan-400 via-blue-500 to-indigo-700',
    },
    BC: {
      iconComponent: Layers,
      description: 'Plasma e piastrine raccolti in un\'unica seduta tramite aferesi avanzata. Massimo impatto.',
      gradient: 'from-fuchsia-400 via-violet-600 to-purple-800',
    },
  }

  const fallback = TYPE_CONFIG['SI']

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">Seleziona il tipo di donazione</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Seleziona il tipo di donazione</h2>
        <p className="text-sm text-muted-foreground">
          Scegli la tipologia più adatta a te. Verificheremo automaticamente la tua idoneità prima di confermare.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {data?.slice().reverse().map((type) => {
          const config = TYPE_CONFIG[type.code] ?? fallback
          const IconComp = config.iconComponent
          const isSelected = selected?.id === type.id

          return (
            <div
              key={type.id}
              onClick={() => onSelect(type)}
              className={`relative rounded-xl cursor-pointer overflow-hidden transition-all duration-200 bg-gradient-to-br ${config.gradient}
                ${isSelected ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-background' : 'hover:brightness-110'}`}
            >
              <div className="p-5 flex flex-col justify-between min-h-[200px]">
                {/* Header: icona + check */}
                <div className="flex items-start justify-between">
                  <div className="bg-white/20 rounded-xl p-2.5">
                    <IconComp className="h-5 w-5 text-white" />
                  </div>
                  {isSelected && (
                    <div className="bg-white/30 rounded-full p-1">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Footer: nome + descrizione */}
                <div className="flex flex-col gap-1 mt-4">
                  <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">
                    {type.code}
                  </p>
                  <p className="text-white text-base font-bold leading-tight">
                    {type.name}
                  </p>
                  <p className="text-white/70 text-xs leading-relaxed mt-1 line-clamp-3">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Costanti data ─────────────────────────────────────────────────────────────

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const DAYS_IT_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

// Giorni visibili a sinistra e destra del giorno selezionato nel carousel
const CAROUSEL_SIDE = 3

// ── Carousel giorni + slot orari ──────────────────────────────────────────────

interface DayStripProps {
  slots: Slot[]
  loading: boolean
  selectedSlot: Slot | null
  onSelectSlot: (s: Slot | null) => void
}

function DayStrip({ slots, loading, selectedSlot, onSelectSlot }: DayStripProps) {
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date(TODAY))

  // Raggruppa slot per giorno (chiave: "YYYY-MM-DD")
  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of slots) {
      const raw = typeof slot.date === 'string' ? slot.date : String(slot.date)
      const key = raw.slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(slot)
      map.set(key, arr)
    }
    return map
  }, [slots])

  const toKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const shiftDay = (delta: number) => {
    const next = new Date(selectedDay)
    next.setDate(selectedDay.getDate() + delta)
    if (next < TODAY) return
    setSelectedDay(next)
    onSelectSlot(null)
  }

  const shiftMonth = (delta: number) => {
    const next = new Date(selectedDay.getFullYear(), selectedDay.getMonth() + delta, 1)
    // Non si torna indietro rispetto al mese corrente
    const todayFirst = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
    if (next < todayFirst) return
    // Se il mese risultante è quello corrente, vai a oggi; altrimenti al primo del mese
    const target = (next.getFullYear() === TODAY.getFullYear() && next.getMonth() === TODAY.getMonth())
      ? new Date(TODAY)
      : next
    setSelectedDay(target)
    onSelectSlot(null)
  }

  // Giorni visibili nel carousel: selectedDay ± CAROUSEL_SIDE
  const visibleDays = useMemo(() =>
    Array.from({ length: CAROUSEL_SIDE * 2 + 1 }, (_, i) => {
      const d = new Date(selectedDay)
      d.setDate(selectedDay.getDate() - CAROUSEL_SIDE + i)
      return d
    }), [selectedDay])

  const daySlots = slotsByDay.get(toKey(selectedDay)) ?? []
  const isAtMinMonth =
    selectedDay.getFullYear() === TODAY.getFullYear() &&
    selectedDay.getMonth() === TODAY.getMonth()
  const isAtMinDay = isSameDay(selectedDay, TODAY)

  return (
    <div className="flex flex-col gap-4">

      {/* Riga 1 — Navigazione mese/anno */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} disabled={isAtMinMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {MONTHS_IT[selectedDay.getMonth()]} {selectedDay.getFullYear()}
        </span>
        <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Riga 2 — Carousel giorni */}
      {loading ? (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex flex-1 gap-2 justify-center">
            {Array.from({ length: CAROUSEL_SIDE * 2 + 1 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => shiftDay(-1)} disabled={isAtMinDay} className="shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 gap-2 justify-center">
            {visibleDays.map((day) => {
              const key = toKey(day)
              const isPast = day < TODAY
              const isSelected = isSameDay(day, selectedDay)

              const variant = isSelected ? 'default' : isPast ? 'ghost' : 'outline'

              return (
                <Button
                  key={key}
                  variant={variant}
                  disabled={isPast}
                  onClick={() => {
                    setSelectedDay(new Date(day))
                    onSelectSlot(null)
                  }}
                  className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg p-0"
                >
                  <span className="text-base font-bold leading-none">{day.getDate()}</span>
                  <span className="text-[11px] leading-none opacity-70">{DAYS_IT_SHORT[day.getDay()]}</span>
                </Button>
              )
            })}
          </div>

          <Button variant="ghost" size="icon" onClick={() => shiftDay(1)} className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Riga 3 — Slot orari del giorno selezionato */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <p className="text-sm font-medium">
          Orari disponibili — {selectedDay.getDate()} {MONTHS_IT[selectedDay.getMonth()]}
        </p>
        {loading ? (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-24" />)}
          </div>
        ) : daySlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuno slot disponibile per questo giorno.</p>
        ) : (
          <div className="grid grid-cols-10 gap-2">
            {daySlots.map((slot) => {
              const available = slot.availability > 0
              const isSlotSelected = selectedSlot?.id === slot.id
              return (
                <Button
                  variant={isSlotSelected ? 'default' : 'outline'}
                  key={slot.id}
                  disabled={!available}
                  onClick={() => available && onSelectSlot(isSlotSelected ? null : slot)}
                  className={`col-span-2 inline-flex items-center gap-1 text-sm border transition-colors
                    ${isSlotSelected ? 'bg-primary text-white font-medium' : ''}
                    ${available && !isSlotSelected ? 'border-border hover:bg-muted/50' : ''}
                    ${!available ? 'border-border text-muted-foreground cursor-not-allowed' : ''}
                  `}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {slot.startTime}
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Step 2: Centro, data e slot ───────────────────────────────────────────────

function StepSlot({
  donationType,
  selectedCenter,
  selectedSlot,
  onSelectCenter,
  onSelectSlot,
}: {
  donationType: DonationType
  selectedCenter: Center | null
  selectedSlot: Slot | null
  onSelectCenter: (c: Center) => void
  onSelectSlot: (s: Slot | null) => void
}) {
  const [comboOpen, setComboOpen] = useState(false)

  const { data: centers, isLoading: loadingCenters } = useQuery({
    queryKey: ['centers'],
    queryFn: fetchCenters,
  })

  const { data: allSlots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', selectedCenter?.id, donationType.id],
    queryFn: () => fetchSlots(selectedCenter!.id, donationType.id),
    enabled: !!selectedCenter,
  })

  const handleSelectCenter = (center: Center) => {
    onSelectCenter(center)
    onSelectSlot(null)
    setComboOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Riga 1 — Combobox sedi */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Centro di donazione</p>
        <Popover open={comboOpen} onOpenChange={setComboOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center max-w-[320px] justify-between text-sm">
              <span className={selectedCenter ? 'text-foreground' : 'text-muted-foreground'}>
                {selectedCenter ? `${selectedCenter.name} — ${selectedCenter.city}` : 'Seleziona un centro…'}
              </span>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 z-[1002]" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>Nessun centro trovato.</CommandEmpty>
                <CommandGroup>
                  {centers?.map((center) => (
                    <CommandItem
                      key={center.id}
                      value={center.name}
                      onSelect={() => handleSelectCenter(center)}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{center.name}</p>
                        <p className="text-xs text-muted-foreground">{center.address}, {center.city}</p>
                      </div>
                      {selectedCenter?.id === center.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Riga 2 — Mappa */}
      <div className="h-[300px] border border-border overflow-hidden rounded-md">
        {loadingCenters ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <CenterMap
            centers={centers ?? []}
            selected={selectedCenter}
            onSelect={handleSelectCenter}
          />
        )}
      </div>

      {/* Riga 3 — Strip giorni + slot orari (larghezza piena) */}
      {selectedCenter && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Seleziona data e orario</p>
          <DayStrip
            slots={allSlots ?? []}
            loading={loadingSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
          />
        </div>
      )}
    </div>
  )
}

// ── Step 3: Conferma ──────────────────────────────────────────────────────────

function StepConfirm({
  donationType,
  center,
  slot,
  onConfirm,
  submitting,
}: {
  donationType: DonationType
  center: Center
  slot: Slot
  onConfirm: () => void
  submitting: boolean
}) {
  const TYPE_GRADIENT: Record<string, string> = {
    SI: 'from-red-400 via-rose-500 to-pink-700',
    PL: 'from-yellow-400 via-amber-500 to-orange-600',
    PT: 'from-cyan-400 via-blue-500 to-indigo-700',
    BC: 'from-fuchsia-400 via-violet-600 to-purple-800',
  }
  const TYPE_ICON_COMPONENT: Record<string, React.ElementType> = {
    SI: Droplets,
    PL: FlaskConical,
    PT: Microscope,
    BC: Layers,
  }

  const gradient = TYPE_GRADIENT[donationType.code] ?? TYPE_GRADIENT['SI']
  const TypeIconComp = TYPE_ICON_COMPONENT[donationType.code] ?? Droplets

  const dateObj = new Date(slot.date)
  const dayNum = dateObj.toLocaleDateString('it-IT', { day: '2-digit' })
  const monthName = dateObj.toLocaleDateString('it-IT', { month: 'long' })
  const weekday = dateObj.toLocaleDateString('it-IT', { weekday: 'long' })
  const year = dateObj.getFullYear()

  const deadlineDate = new Date(slot.date)
  deadlineDate.setDate(deadlineDate.getDate() - 2)
  const deadlineFormatted = deadlineDate.toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Grid: banner tipo + sede + data — stessa struttura di booking-info-grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Banner tipo donazione */}
        <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 flex flex-col justify-between min-h-[180px]`}>
          <div className="bg-white/20 rounded-xl p-3 w-fit">
            <TypeIconComp className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col gap-1 mt-6">
            <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Tipo donazione</p>
            <p className="text-white text-2xl font-bold leading-tight">{donationType.name}</p>
            <p className="text-white/70 text-sm mt-1">
              Ogni {donationType.minIntervalDays}gg · min. {donationType.minWeightKg} kg
            </p>
          </div>
        </div>

        {/* Cards sede + data */}
        <div className="flex flex-col gap-4">

          {/* Sede */}
          <Card className="flex-1 border-border">
            <CardContent className="p-5 flex items-start gap-4 h-full">
              <div className="bg-muted rounded-lg p-2.5 shrink-0">
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Sede di donazione</p>
                <p className="text-sm font-semibold leading-snug">{center.name}</p>
                <p className="text-xs text-muted-foreground">{center.address}, {center.city}</p>
              </div>
            </CardContent>
          </Card>

          {/* Data e orario */}
          <Card className="flex-1 border-border">
            <CardContent className="p-5 flex items-start gap-4 h-full">
              <div className="bg-muted rounded-lg p-2.5 shrink-0">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground font-medium">Data e orario</p>
                <p className="text-sm font-semibold capitalize">{weekday} {dayNum} {monthName} {year}</p>
                <p className="text-xs text-muted-foreground">
                  {slot.startTime}{slot.endTime ? ` – ${slot.endTime}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Info block questionario */}
      <div className="flex gap-3 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-4">
        <Info className="h-6 w-6 shrink-0 text-blue-500 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Questionario anamnestico richiesto</p>
          <p className="text-sm text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
            Dopo la conferma dovrai compilare il questionario anamnestico entro il{' '}
            <span className="font-semibold">{deadlineFormatted}</span>.
            Verrà visionato dal medico prima dell'appuntamento. In caso di mancata compilazione o risposte incompatibili la prenotazione potrà essere annullata.
          </p>
        </div>
      </div>

      {/* Bottone conferma */}
      <Button onClick={onConfirm} disabled={submitting} className="w-full sm:w-auto self-start">
        {submitting ? 'Conferma in corso...' : 'Conferma prenotazione'}
      </Button>
    </div>
  )
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function NewBookingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [donationType, setDonationType] = useState<DonationType | null>(null)
  const [center, setCenter] = useState<Center | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canNext =
    (step === 0 && !!donationType) ||
    (step === 1 && !!center && !!slot)

  const handleSubmit = async () => {
    if (!slot || !donationType) return
    setSubmitting(true)
    try {
      await apiClient.post('/bookings', {
        slotId: slot.id,
        donationTypeId: donationType.id,
      })
      await queryClient.invalidateQueries({ queryKey: ['donor', 'bookings'] })
      toast.success('Prenotazione confermata.')
      router.push('/donors/bookings')
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message ?? 'Errore durante la prenotazione.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold">Nuova prenotazione</h1>
          <p className="text-sm text-muted-foreground">Prenota una donazione in pochi passi.</p>
        </div>
        {/* Navigazione */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => step === 0 ? router.back() : setStep(step - 1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {step < 2 ? (
            <Button
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              size={'icon-lg'}
            >
              <ChevronRight className="h-10 w-10" />
            </Button>
          ) : (
            <></>
          )}
        </div>
      </div>


      {/* Step indicator */}
      <div className="my-2">
        <StepIndicator current={step} />
      </div>

      {/* Contenuto step */}
      <div className="flex flex-col flex-1 min-h-0">
        {step === 0 && (
          <StepDonationType
            selected={donationType}
            onSelect={setDonationType}
          />
        )}
        {step === 1 && donationType && (
          <StepSlot
            donationType={donationType}
            selectedCenter={center}
            selectedSlot={slot}
            onSelectCenter={(c) => { setCenter(c); setSlot(null) }}
            onSelectSlot={setSlot}
          />
        )}
        {step === 2 && donationType && center && slot && (
          <StepConfirm
            donationType={donationType}
            center={center}
            slot={slot}
            onConfirm={handleSubmit}
            submitting={submitting}
          />
        )}
      </div>


    </div>
  )
}
