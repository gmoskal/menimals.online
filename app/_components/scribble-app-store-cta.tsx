"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { useReducedMotion } from "motion/react"
import { appStoreBadgeContentDesktopWidth, appStoreBadgeContentMobileWidth } from "../_lib/app-store-badge-sizing"
import { scribbleAnimationKeySplines, scribbleAnimationKeyTimes, scribbleAnimationValues } from "../_lib/scribble-animation"
import { createScribbleMarkerSegments, safeScribbleStrokeCount, type ScribbleStrokeAxis } from "../_lib/scribble-marker"

type ScribbleAppStoreCtaProps = {
    ariaLabel: string
    height: number
    href: string
    isActive?: boolean
    markerStrokeWidth: number
    mobileScale?: number
    onDrawComplete?: () => void
    strokeAxis?: ScribbleStrokeAxis
    strokeCount: number
    width: number
}

type ScribbleMarkerProps = {
    isDrawn: boolean
    shouldAnimate: boolean
    strokeAxis: ScribbleStrokeAxis
    strokeCount: number
    strokeWidth: number
}

type ScribbleCtaStyle = CSSProperties & {
    "--scribble-height": string
    "--scribble-mobile-height": string
    "--scribble-mobile-width": string
    "--scribble-width": string
}

type AppStoreBadgeContentStyle = CSSProperties & {
    "--app-store-badge-desktop-width": string
    "--app-store-badge-mobile-width": string
}

const defaultMobileScale = 0.72
const defaultScribbleStrokeAxis: ScribbleStrokeAxis = "horizontal"
const scribbleViewBox = "0 0 640 250"
const scribblePathLength = 1
const scribbleDashHidden = 1
const scribbleDashVisible = 0
const scribbleSegmentOpacityHidden = 0
const scribbleSegmentOpacityVisible = 1
const scribbleSegmentRevealDelaySeconds = 0.025
const appStoreBadgeContentMask = "/app-store-badge-content-mask.svg"
const scribbleSegmentAnimationKeySplines = scribbleAnimationKeySplines(1)
const scribbleSegmentAnimationKeyTimes = scribbleAnimationKeyTimes(1)
const scribbleSegmentAnimationValues = scribbleAnimationValues(1)
const scribbleMarkerTiming = {
    baseDurationSeconds: 0.62,
    maxDurationSeconds: 1.55,
    minDurationSeconds: 0.82,
    perStrokeDurationSeconds: 0.07,
} as const

function getScribbleMarkerDurationSeconds(strokeCount: number) {
    const duration = scribbleMarkerTiming.baseDurationSeconds + safeScribbleStrokeCount(strokeCount) * scribbleMarkerTiming.perStrokeDurationSeconds

    return Math.min(scribbleMarkerTiming.maxDurationSeconds, Math.max(scribbleMarkerTiming.minDurationSeconds, duration))
}

function getScribbleSegmentRevealBeginSeconds(delaySeconds: number) {
    return Number((delaySeconds + scribbleSegmentRevealDelaySeconds).toFixed(3))
}

function ScribbleMarker(p: ScribbleMarkerProps) {
    const initialDashOffset = p.isDrawn && !p.shouldAnimate ? scribbleDashVisible : scribbleDashHidden
    const markerSegments = createScribbleMarkerSegments(p.strokeAxis, p.strokeCount, p.strokeWidth, getScribbleMarkerDurationSeconds(p.strokeCount))

    return (
        <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full overflow-visible text-[var(--scribble-marker-color)]"
            preserveAspectRatio="none"
            viewBox={scribbleViewBox}
        >
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                {markerSegments.map((segment) => (
                    <path
                        key={segment.path}
                        d={segment.path}
                        pathLength={scribblePathLength}
                        strokeDasharray={scribblePathLength}
                        strokeDashoffset={initialDashOffset}
                        opacity={p.shouldAnimate ? scribbleSegmentOpacityHidden : scribbleSegmentOpacityVisible}
                        strokeWidth={segment.strokeWidth}
                    >
                        {p.shouldAnimate ? (
                            <>
                                <set
                                    attributeName="opacity"
                                    begin={`${getScribbleSegmentRevealBeginSeconds(segment.delaySeconds)}s`}
                                    fill="freeze"
                                    to={scribbleSegmentOpacityVisible}
                                />
                                <animate
                                    attributeName="stroke-dashoffset"
                                    begin={`${segment.delaySeconds}s`}
                                    calcMode="spline"
                                    dur={`${segment.durationSeconds}s`}
                                    fill="freeze"
                                    keySplines={scribbleSegmentAnimationKeySplines}
                                    keyTimes={scribbleSegmentAnimationKeyTimes}
                                    values={scribbleSegmentAnimationValues}
                                />
                            </>
                        ) : null}
                    </path>
                ))}
            </g>
        </svg>
    )
}

function AppStoreBadgeContent() {
    const maskStyle: AppStoreBadgeContentStyle = {
        "--app-store-badge-desktop-width": appStoreBadgeContentDesktopWidth,
        "--app-store-badge-mobile-width": appStoreBadgeContentMobileWidth,
        maskImage: `url(${appStoreBadgeContentMask})`,
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: `url(${appStoreBadgeContentMask})`,
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
    }

    return (
        <span
            aria-hidden="true"
            className="block aspect-[135/40] w-[var(--app-store-badge-mobile-width)] bg-[var(--page-bg)] sm:w-[var(--app-store-badge-desktop-width)]"
            style={maskStyle}
        />
    )
}

export function ScribbleAppStoreCta(p: ScribbleAppStoreCtaProps) {
    const reduceMotion = Boolean(useReducedMotion())
    const [animationToken, setAnimationToken] = useState(0)
    const [hasStarted, setHasStarted] = useState(reduceMotion)
    const isActive = p.isActive ?? true
    const mobileScale = p.mobileScale ?? defaultMobileScale
    const shouldAnimate = isActive && !reduceMotion && animationToken > 0
    const shouldRenderMarker = isActive && (hasStarted || reduceMotion)
    const drawDurationMs = Math.ceil(getScribbleMarkerDurationSeconds(p.strokeCount) * 1000)
    const ctaStyle: ScribbleCtaStyle = {
        "--scribble-height": `${p.height}px`,
        "--scribble-mobile-height": `${Math.round(p.height * mobileScale)}px`,
        "--scribble-mobile-width": `${Math.round(p.width * mobileScale)}px`,
        "--scribble-width": `${p.width}px`,
    }

    useEffect(() => {
        if (!isActive || hasStarted) {
            return
        }

        setHasStarted(true)
        setAnimationToken((token) => token + 1)
    }, [hasStarted, isActive])

    useEffect(() => {
        if (isActive || !hasStarted) {
            return
        }

        setHasStarted(false)
    }, [hasStarted, isActive])

    useEffect(() => {
        if (!isActive) {
            return
        }

        if (reduceMotion) {
            p.onDrawComplete?.()
            return
        }

        if (!hasStarted || animationToken === 0) {
            return
        }

        const drawCompleteTimer = window.setTimeout(() => p.onDrawComplete?.(), drawDurationMs)

        return () => window.clearTimeout(drawCompleteTimer)
    }, [animationToken, drawDurationMs, hasStarted, isActive, p.onDrawComplete, reduceMotion])

    return (
        <a
            href={p.href}
            aria-label={p.ariaLabel}
            title={p.ariaLabel}
            className="group relative inline-grid h-[var(--scribble-mobile-height)] w-[min(92vw,var(--scribble-mobile-width))] touch-manipulation place-items-center overflow-visible text-[var(--text-primary)] transition-transform duration-200 ease-out hover:scale-[1.035] active:scale-[0.99] focus-visible:outline-none focus-visible:drop-shadow-[0_0_0_3px_var(--selection-bg)] sm:h-[var(--scribble-height)] sm:w-[var(--scribble-width)]"
            style={ctaStyle}
        >
            {shouldRenderMarker ? (
                <ScribbleMarker
                    key={animationToken}
                    isDrawn={hasStarted || reduceMotion}
                    shouldAnimate={shouldAnimate}
                    strokeAxis={p.strokeAxis ?? defaultScribbleStrokeAxis}
                    strokeCount={p.strokeCount}
                    strokeWidth={p.markerStrokeWidth}
                />
            ) : null}
            <span className="relative z-10 grid h-full w-full place-items-center">
                <AppStoreBadgeContent />
            </span>
        </a>
    )
}
