'use client'

import { Badge } from '@/components/ui/badge'

interface UncertaintyBadgeProps {
  confidence: number
}

export function UncertaintyBadge({ confidence }: UncertaintyBadgeProps) {
  const isFlagged = confidence < 0.8
  const percentage = Math.round(confidence * 100)

  return (
    <Badge
      variant={isFlagged ? 'destructive' : 'secondary'}
      className="cursor-help"
      title={`Confidence: ${percentage}%`}
    >
      {percentage}%
    </Badge>
  )
}
