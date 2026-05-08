const CART_CHANGED_EVENT = "cart:changed"

export function notifyCartChanged(){
    if(typeof window === "undefined") return
    window.dispatchEvent(new Event(CART_CHANGED_EVENT))
}

export function subscribeToCartChanged(callback){
    if(typeof window === "undefined") return () => {}
    window.addEventListener(CART_CHANGED_EVENT, callback)
    return () => window.removeEventListener(CART_CHANGED_EVENT, callback)
}

