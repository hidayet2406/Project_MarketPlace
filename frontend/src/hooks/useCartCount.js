import { useEffect, useState } from "react"
import { getCart } from "../api/cart"
import { subscribeToCartChanged } from "../utils/cartEvents"

export default function useCartCount(){

    const [count, setCount] = useState(0)

    useEffect(() => {
        let cancelled = false

        const refresh = async () => {
            const token = localStorage.getItem("token")
            if(!token){
                if(!cancelled) setCount(0)
                return
            }
            try{
                const cart = await getCart()
                if(!cancelled) setCount(Number(cart?.totalQuantity || 0))
            }catch{
                if(!cancelled) setCount(0)
            }
        }

        refresh()
        const unsub = subscribeToCartChanged(() => { refresh() })

        return () => {
            cancelled = true
            unsub()
        }
    }, [])

    return count
}

