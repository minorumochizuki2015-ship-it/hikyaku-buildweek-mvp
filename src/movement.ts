import type { AvailableMinutes, Energy } from '../shared/mockMission'

export type MovementMode = 'walk' | 'demo'

export interface Coordinate {
  latitude: number
  longitude: number
}

const walkingMetresPerMinute: Record<Energy, number> = {
  Low: 60,
  Steady: 80,
  Ready: 100,
}

export function distanceTargetMetres(availableMinutes: AvailableMinutes, energy: Energy): number {
  return availableMinutes * walkingMetresPerMinute[energy]
}

export function haversineDistanceMetres(from: Coordinate, to: Coordinate): number {
  const earthRadiusMetres = 6_371_000
  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = toRadians(to.latitude - from.latitude)
  const longitudeDelta = toRadians(to.longitude - from.longitude)
  const startLatitude = toRadians(from.latitude)
  const endLatitude = toRadians(to.latitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2

  return 2 * earthRadiusMetres * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function startWalkTracking(
  geolocation: Pick<Geolocation, 'watchPosition' | 'clearWatch'>,
  startingDistanceMetres: number,
  targetDistanceMetres: number,
  onDistance: (distanceMetres: number, progress: number) => void,
  onUnavailable: () => void,
): () => void {
  let previousPosition: Coordinate | null = null
  let totalDistanceMetres = startingDistanceMetres
  let unavailable = false
  const watchId = geolocation.watchPosition(
    (position) => {
      const currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
      if (previousPosition) {
        totalDistanceMetres += haversineDistanceMetres(previousPosition, currentPosition)
        onDistance(totalDistanceMetres, Math.min(100, Math.round(totalDistanceMetres / targetDistanceMetres * 100)))
      }
      previousPosition = currentPosition
    },
    () => {
      if (unavailable) return
      unavailable = true
      geolocation.clearWatch(watchId)
      onUnavailable()
    },
    { enableHighAccuracy: true },
  )

  return () => {
    geolocation.clearWatch(watchId)
  }
}
