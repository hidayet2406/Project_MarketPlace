import axios from "axios";
import { notifyAuthChanged } from "../utils/authEvents"

export const API_BASE_URL = "http://localhost:8080"

const API = axios.create({
    baseURL: API_BASE_URL
})

API.interceptors.request.use((req)=> {
    const token = localStorage.getItem("token")

    if(token && token.split(".").length === 3){
        // Axios v1 may use AxiosHeaders; support both styles.
        if(req.headers && typeof req.headers.set === "function"){
            req.headers.set("Authorization", `Bearer ${token}`)
        }else{
            req.headers = req.headers || {}
            req.headers.Authorization = `Bearer ${token}`
        }
    }else if(token){
        // Cleanup invalid/legacy tokens so backend doesn't try parsing garbage.
        localStorage.removeItem("token")
        notifyAuthChanged()
    }
    return req;
})

export default API;

