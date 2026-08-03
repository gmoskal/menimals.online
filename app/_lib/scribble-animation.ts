const scribbleTurnKeySpline = "0.45 0 0.55 1"

function safeSegmentCount(segmentCount: number) {
    return Math.max(1, Math.round(segmentCount))
}

function formatAnimationValue(value: number) {
    return Number(value.toFixed(3)).toString()
}

export function scribbleAnimationKeySplines(segmentCount: number) {
    return Array.from({ length: safeSegmentCount(segmentCount) }, () => scribbleTurnKeySpline).join(";")
}

export function scribbleAnimationKeyTimes(segmentCount: number) {
    const count = safeSegmentCount(segmentCount)

    return Array.from({ length: count + 1 }, (_, index) => formatAnimationValue(index / count)).join(";")
}

export function scribbleAnimationValues(segmentCount: number) {
    const count = safeSegmentCount(segmentCount)

    return Array.from({ length: count + 1 }, (_, index) => formatAnimationValue(1 - index / count)).join(";")
}
