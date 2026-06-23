'use client'

import { useEffect, useRef, useState } from 'react'
import type * as Leaflet from 'leaflet'

import type { Center } from '@/lib/types'

interface LocationsMapProps {
  centers: Center[]
  selected: Center | null
  onSelect: (center: Center) => void
}

function hasCoordinates(center: Center): center is Center & { latitude: number; longitude: number } {
  return center.latitude != null && center.longitude != null
}

function makeIconHtml(selected: boolean) {
  return `<div style="
    width:18px;height:18px;border-radius:50%;
    background:${selected ? '#2563eb' : '#fff'};
    border:3px solid #2563eb;
    box-shadow:0 2px 8px rgba(15,23,42,.28);
  "></div>`
}

function makePopupContent(center: Center) {
  const wrapper = document.createElement('div')
  wrapper.style.display = 'grid'
  wrapper.style.gap = '2px'

  const title = document.createElement('strong')
  title.textContent = center.name

  const address = document.createElement('span')
  address.style.fontSize = '12px'
  address.style.color = '#64748b'
  address.textContent = `${center.address}, ${center.city}`

  wrapper.append(title, address)
  return wrapper
}

export function LocationsMap({ centers, selected, onSelect }: LocationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const stateRef = useRef<{
    map: Leaflet.Map
    L: typeof Leaflet
    markers: Map<string, Leaflet.Marker>
  } | null>(null)

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
      setIsReady(true)
    }

    init()

    return () => {
      cancelled = true
      stateRef.current?.map.remove()
      stateRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isReady || !stateRef.current) return
    const { map, L, markers } = stateRef.current
    const mappableCenters = centers.filter(hasCoordinates)
    const incoming = new Set(mappableCenters.map((center) => center.id))

    markers.forEach((marker, id) => {
      if (!incoming.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    })

    mappableCenters.forEach((center) => {
      const icon = L.divIcon({
        className: '',
        html: makeIconHtml(selected?.id === center.id),
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10],
      })

      const existing = markers.get(center.id)
      if (existing) {
        existing.setIcon(icon)
        existing.setLatLng([center.latitude, center.longitude])
        return
      }

      const marker = L.marker([center.latitude, center.longitude], { icon })
        .addTo(map)
        .bindPopup(makePopupContent(center))
        .on('click', () => onSelect(center))

      markers.set(center.id, marker)
    })

    if (mappableCenters.length > 1 && !selected) {
      const bounds = L.latLngBounds(mappableCenters.map((center) => [center.latitude, center.longitude]))
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 })
    }

    if (mappableCenters.length === 1 && !selected) {
      map.setView([mappableCenters[0].latitude, mappableCenters[0].longitude], 12)
    }
  }, [centers, isReady, onSelect, selected])

  useEffect(() => {
    if (!isReady || !stateRef.current || !selected || !hasCoordinates(selected)) return
    stateRef.current.map.flyTo([selected.latitude, selected.longitude], 13, { duration: 0.8 })
    stateRef.current.markers.get(selected.id)?.openPopup()
  }, [isReady, selected])

  return <div ref={containerRef} className="h-full w-full" />
}
