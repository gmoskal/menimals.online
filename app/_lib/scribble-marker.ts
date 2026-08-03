export type ScribbleStrokeAxis = (typeof scribbleStrokeAxes)[number]

export type ScribbleMarkerSegment = {
    delaySeconds: number
    durationSeconds: number
    path: string
    strokeWidth: number
}

type ScribblePoint = {
    x: number
    y: number
}

export const scribbleStrokeAxes = ["vertical", "horizontal"] as const
const scribblePathBounds = {
    bottom: 226,
    left: 20,
    right: 622,
    top: 24,
} as const
const scribbleStrokeCountLimits = {
    max: 18,
    min: 1,
} as const
const scribbleTurnLengthVariation = {
    max: 0.1,
    min: 0.05,
} as const
const scribbleSegmentStrokeWidthRatios = {
    edge: 0.88,
    middle: 1,
    nearEdge: 0.96,
} as const

function clampNumber(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function formatScribbleCoordinate(value: number) {
    return Math.round(value)
}

function formatScribbleSeconds(value: number) {
    return Number(value.toFixed(3))
}

function getScribbleTurnLengthRatio(index: number) {
    const weight = (Math.sin(index * 1.73) + 1) / 2

    return scribbleTurnLengthVariation.min + weight * (scribbleTurnLengthVariation.max - scribbleTurnLengthVariation.min)
}

function getScribbleTurnInset(index: number, axisLength: number) {
    return axisLength * getScribbleTurnLengthRatio(index)
}

function createScribbleSegmentPath(startPoint: ScribblePoint, endPoint: ScribblePoint) {
    return `M${formatScribbleCoordinate(startPoint.x)} ${formatScribbleCoordinate(startPoint.y)} L${formatScribbleCoordinate(endPoint.x)} ${formatScribbleCoordinate(endPoint.y)}`
}

function getScribblePointDistance(startPoint: ScribblePoint, endPoint: ScribblePoint) {
    return Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
}

export function safeScribbleStrokeCount(strokeCount: number) {
    return Math.round(clampNumber(strokeCount, scribbleStrokeCountLimits.min, scribbleStrokeCountLimits.max))
}

function getScribbleSegmentStrokeWidth(strokeWidth: number, segmentIndex: number, segmentCount: number) {
    if (segmentCount === 1) {
        return formatScribbleCoordinate(strokeWidth)
    }

    const edgeDistance = Math.min(segmentIndex, segmentCount - segmentIndex - 1)
    const ratio = edgeDistance === 0 ? scribbleSegmentStrokeWidthRatios.edge : edgeDistance === 1 ? scribbleSegmentStrokeWidthRatios.nearEdge : scribbleSegmentStrokeWidthRatios.middle

    return formatScribbleCoordinate(strokeWidth * ratio)
}

function createVerticalScribblePoints(strokeCount: number) {
    const count = safeScribbleStrokeCount(strokeCount)
    const xStep = (scribblePathBounds.right - scribblePathBounds.left) / count
    const axisLength = scribblePathBounds.bottom - scribblePathBounds.top
    const points: ScribblePoint[] = [
        {
            x: scribblePathBounds.left,
            y: scribblePathBounds.bottom - getScribbleTurnInset(0, axisLength),
        },
    ]

    for (let index = 1; index <= count; index += 1) {
        const xOffset = Math.sin(index * 1.7) * 9
        const yOffset = Math.cos(index * 2.1) * 10
        const turnInset = getScribbleTurnInset(index, axisLength)
        const x = clampNumber(scribblePathBounds.left + index * xStep + xOffset, scribblePathBounds.left, scribblePathBounds.right)
        const yBase = index % 2 === 1 ? scribblePathBounds.top + turnInset : scribblePathBounds.bottom - turnInset
        const y = clampNumber(yBase + yOffset, scribblePathBounds.top, scribblePathBounds.bottom)

        points.push({ x, y })
    }

    return points
}

function createHorizontalScribblePoints(strokeCount: number) {
    const count = safeScribbleStrokeCount(strokeCount)
    const axisLength = scribblePathBounds.right - scribblePathBounds.left

    if (count === 1) {
        const centerY = (scribblePathBounds.top + scribblePathBounds.bottom) / 2
        const startInset = getScribbleTurnInset(0, axisLength)
        const endInset = getScribbleTurnInset(1, axisLength)

        return [
            {
                x: scribblePathBounds.left + startInset,
                y: centerY,
            },
            {
                x: scribblePathBounds.right - endInset,
                y: centerY,
            },
        ]
    }

    const yStep = (scribblePathBounds.bottom - scribblePathBounds.top) / count
    const points: ScribblePoint[] = [
        {
            x: scribblePathBounds.left + getScribbleTurnInset(0, axisLength),
            y: scribblePathBounds.top + 30,
        },
    ]

    for (let index = 1; index <= count; index += 1) {
        const turnInset = getScribbleTurnInset(index, axisLength)
        const x = index % 2 === 1 ? scribblePathBounds.right - turnInset : scribblePathBounds.left + turnInset
        const y = clampNumber(scribblePathBounds.top + index * yStep, scribblePathBounds.top, scribblePathBounds.bottom)

        points.push({ x, y })
    }

    return points
}

function createScribbleMarkerPoints(strokeAxis: ScribbleStrokeAxis, strokeCount: number) {
    return strokeAxis === "horizontal" ? createHorizontalScribblePoints(strokeCount) : createVerticalScribblePoints(strokeCount)
}

export function createScribbleMarkerSegments(strokeAxis: ScribbleStrokeAxis, strokeCount: number, strokeWidth: number, totalDurationSeconds: number) {
    const points = createScribbleMarkerPoints(strokeAxis, strokeCount)
    const distances = points.slice(1).map((point, index) => getScribblePointDistance(points[index], point))
    const totalDistance = distances.reduce((sum, distance) => sum + distance, 0)
    const segmentCount = distances.length
    let elapsedSeconds = 0

    return distances.map((distance, index): ScribbleMarkerSegment => {
        const startPoint = points[index]
        const endPoint = points[index + 1]
        const durationSeconds = totalDistance > 0 ? totalDurationSeconds * (distance / totalDistance) : totalDurationSeconds / segmentCount
        const segment = {
            delaySeconds: formatScribbleSeconds(elapsedSeconds),
            durationSeconds: formatScribbleSeconds(durationSeconds),
            path: createScribbleSegmentPath(startPoint, endPoint),
            strokeWidth: getScribbleSegmentStrokeWidth(strokeWidth, index, segmentCount),
        }

        elapsedSeconds += durationSeconds

        return segment
    })
}
