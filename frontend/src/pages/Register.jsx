import { useState } from "react"
import API from "../api/api"
import { Link, useNavigate } from "react-router-dom"
import "../styles/main.css"
import "../styles/auth.css"

function Register(){

    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)

    const [form,setForm] = useState({
        username:"",
        email:"",
        password:""
    })

    const handleChange = (e)=>{
        setForm({...form,[e.target.name]:e.target.value})
    }

    const register = async ()=>{
        try{

            await API.post("/auth/register",form)

            alert("User created")

            navigate("/")

        }catch(err){
            const msg = err?.response?.data?.message || err?.response?.data || "Register error"
            alert(msg)
        }
    }

    return(

        <div className="auth-page">
        <div className="auth-container">

            <h2>Register</h2>

            <input name="username" placeholder="Username" onChange={handleChange}/>
            <input name="email" placeholder="Email" onChange={handleChange}/>
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

            <button onClick={register}>Register</button>

            <div className="auth-link">
                Already have an account? <Link to="/login">Sign in</Link>
            </div>

        </div>
        </div>
    )
}

export default Register
