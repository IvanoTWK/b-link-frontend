'use client'

import { useEffect, useRef } from 'react'
import type { Center } from '@/lib/types'

interface CenterMapProps {
  centers: Center[]
  selected: Center | null
  onSelect: (c: Center) => void
}

function makeIconHtml(selected: boolean) {
  return `<div style="
    width:16px;height:16px;border-radius:50%;
    background:${selected ? '#2563eb' : '#fff'};
    border:2.5px solid #2563eb;
    box-shadow:0 2px 6px rgba(0,0,0,.3);
  "></div>`
}

export default function CenterMap({ centers, selected, onSelect }: CenterMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{
    map: any
    L: any
    markers: Map<string, any>
  } | null>(null)

  // Init mappa una volta sola dopo il mount
  useEffect(() => {
    if (!containerRef.current || stateRef.current) return

    let cancelled = false

    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true }).setView([42.5, 12.5], 6)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      stateRef.current = { map, L, markers: new Map() }
    }

    init()

    return () => {
      cancelled = true
      if (stateRef.current?.map) {
        stateRef.current.map.remove()
        stateRef.current = null
      }
    }
  }, [])

  // Aggiorna marker quando cambiano centri o selezione
  useEffect(() => {
    if (!stateRef.current) return
    const { map, L, markers } = stateRef.current

    // Rimuove i marker obsoleti e aggiorna quelli esistenti
    const incoming = new Set(centers.filter(c => c.latitude && c.longitude).map(c => c.id))

    // Rimuovi marker non più presenti
    markers.forEach((marker, id) => {
      if (!incoming.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    })

    // Aggiungi o aggiorna
    centers
      .filter(c => c.latitude != null && c.longitude != null)
      .forEach(center => {
        const isSelected = selected?.id === center.id
        const icon = L.divIcon({
          className: '',
          html: makeIconHtml(isSelected),
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          popupAnchor: [0, -10],
        })

        if (markers.has(center.id)) {
          // Aggiorna icona esistente
          markers.get(center.id).setIcon(icon)
        } else {
          // Crea nuovo marker
          const marker = L.marker([center.latitude!, center.longitude!], { icon })
            .addTo(map)
            .bindPopup(`<b>${center.name}</b><br/><span style="font-size:12px;color:#666">${center.address}, ${center.city}</span>`)
            .on('click', () => onSelect(center))
          markers.set(center.id, marker)
        }
      })
  }, [centers, selected, onSelect])

  // Vola verso il centro selezionato
  useEffect(() => {
    if (!stateRef.current || !selected?.latitude || !selected?.longitude) return
    stateRef.current.map.flyTo([selected.latitude, selected.longitude], 13, { duration: 0.8 })
  }, [selected])

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
}
