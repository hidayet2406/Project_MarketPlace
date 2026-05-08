import { useEffect, useState } from "react"
import API from "../api/api"
import { notifyAuthChanged, subscribeToAuthChanged } from "../utils/authEvents"

export default function useMe(){

    const [me, setMe] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            if(!cancelled) setLoading(true)
            const token = localStorage.getItem("token")
            if(!token){
                if(!cancelled){
                    setMe(null)
                    setLoading(false)
                }
                return
            }

            try{
                const res = await API.get("/user/findMe")
                if(!cancelled){
                    setMe(res.data)
                    setLoading(false)
                }
            }catch(err){
                // Token may be invalid/expired; cleanup so UI doesn't keep trying.
                if(err?.response?.status === 401){
                    localStorage.removeItem("token")
                    notifyAuthChanged()
                }
                if(!cancelled){
                    setMe(null)
                    setLoading(false)
                }
            }
        }

        load()
        const unsub = subscribeToAuthChanged(() => { load() })
        return () => {
            cancelled = true
            unsub()
        }
    }, [])

    return { me, loading }
}
