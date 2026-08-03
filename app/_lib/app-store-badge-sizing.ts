const appStoreBadgeContentWidthValues = {
    desktopPx: 300,
    mobileMaxPx: 220,
    mobileMinPx: 180,
    mobileViewportWidth: 58,
} as const

export const appStoreBadgeContentDesktopWidth = `${appStoreBadgeContentWidthValues.desktopPx}px`
export const appStoreBadgeContentMobileWidth = `clamp(${appStoreBadgeContentWidthValues.mobileMinPx}px, ${appStoreBadgeContentWidthValues.mobileViewportWidth}vw, ${appStoreBadgeContentWidthValues.mobileMaxPx}px)`
