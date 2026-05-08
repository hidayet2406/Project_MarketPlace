import { useState } from "react"
import API from "../api/api"
import { Link, useNavigate } from "react-router-dom"
import "../styles/main.css"
import "../styles/auth.css"
import { notifyAuthChanged } from "../utils/authEvents"

function Login(){

    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)

    const [form,setForm] = useState({
        username:"",
        password:""
    })

    const handleChange = (e)=>{
        setForm({...form,[e.target.name]:e.target.value})
    }

    const login = async ()=>{
        try{

            const res = await API.post("/auth/login",form)

            const token = String(res.data || "")
            const isJwt = (token.split(".").length === 3)

            if(!isJwt){
                localStorage.removeItem("token")
                alert("Login failed (invalid token).")
                return
            }

            localStorage.setItem("token", token)
            notifyAuthChanged()

            navigate("/")

        }catch(err){
            localStorage.removeItem("token")
            const msg = err?.response?.data?.message || err?.response?.data || "Login failed"
            alert(msg)
        }
    }

    return(

        <div className="auth-page">
        <div className="auth-container">
            <h2>Login</h2>

            <input name="username" placeholder="Username" onChange={handleChange}/>
            <div className="auth-field">
                <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    onChange={handleChange}
                />
                <button
                    className="auth-eye"
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                            d="M12 5C6.5 5 2.1 8.6 1 12c1.1 3.4 5.5 7 11 7s9.9-3.6 11-7c-1.1-3.4-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>

            <button onClick={login}>Login</button>

            <div className="auth-link">
                No account? <Link to="/register">Create one</Link>
            </div>
            <div style={{ marginTop: 30 }}>
                <Link to="/" style={{ color: "var(--mp-link)", textDecoration: "none", fontWeight: 800 }}>Back to home ?</Link>
            </div>

        </div>
        </div>
    )
}

export default Login
