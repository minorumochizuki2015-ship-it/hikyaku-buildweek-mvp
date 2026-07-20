export type CheckpointState = 'completed' | 'current' | 'upcoming'

export interface CheckpointWaypoint {
  name: string
  progress: number
}

export interface CheckpointRouteState {
  waypoints: Array<CheckpointWaypoint & { state: CheckpointState }>
  nextCheckpoint: (CheckpointWaypoint & { distanceRemainingMetres: number }) | null
}

// 日本橋 is named in the curated mission material; the remaining crossings lead
// north-east along the familiar Edo river-road imagery used by this route.
export const checkpointWaypoints: CheckpointWaypoint[] = [
  { name: '日本橋', progress: 20 },
  { name: '両国橋', progress: 40 },
  { name: '浅草寺', progress: 60 },
  { name: '駒形堂', progress: 80 },
]

export function checkpointRouteState(progress: number, targetDistanceMetres: number): CheckpointRouteState {
  const boundedProgress = Math.max(0, Math.min(100, progress))
  const approachingWindow = 15
  const waypoints = checkpointWaypoints.map((waypoint) => ({
    ...waypoint,
    state: boundedProgress >= waypoint.progress
      ? 'completed' as const
      : boundedProgress >= waypoint.progress - approachingWindow
        ? 'current' as const
        : 'upcoming' as const,
  }))
  const nextWaypoint = checkpointWaypoints.find((waypoint) => boundedProgress < waypoint.progress)

  return {
    waypoints,
    nextCheckpoint: nextWaypoint
      ? {
          ...nextWaypoint,
          distanceRemainingMetres: Math.max(0, Math.ceil(targetDistanceMetres * (nextWaypoint.progress - boundedProgress) / 100)),
        }
      : null,
  }
}
