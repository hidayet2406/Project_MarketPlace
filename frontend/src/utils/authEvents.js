const AUTH_CHANGED_EVENT = "auth:changed"

export function notifyAuthChanged(){
    if(typeof window === "undefined") return
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function subscribeToAuthChanged(callback){
    if(typeof window === "undefined") return () => {}
    window.addEventListener(AUTH_CHANGED_EVENT, callback)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, callback)
}

