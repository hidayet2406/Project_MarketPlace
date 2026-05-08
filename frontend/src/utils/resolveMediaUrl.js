import { API_BASE_URL } from "../api/api"

export function resolveMediaUrl(input){
    const s = (input || "").trim()
    if(!s) return ""

    // Already absolute (or inline data)
    if(/^https?:\/\//i.test(s) || s.startsWith("data:")) return s

    const base = String(API_BASE_URL || "").replace(/\/+$/, "")

    // If backend stores "/pictures/x.jpg" (recommended), prefix backend origin.
    if(s.startsWith("/")) return `${base}${s}`

    // Legacy/shortcut: if it's just a filename, assume it lives under /pictures/.
    const normalized = s.replace(/\\/g, "/")
    if(!normalized.includes("/")) return `${base}/pictures/${encodeURIComponent(normalized)}`

    // "pictures/x.jpg" (without leading slash)
    if(normalized.startsWith("pictures/")) return `${base}/${normalized}`

    // Fallback: treat as path relative to backend origin.
    return `${base}/${normalized}`
}
