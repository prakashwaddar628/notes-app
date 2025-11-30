import { useState } from "react"
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

export default function RegisterPage(){
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/auth/register", {email, password});
            navigate("/login");
        }catch(err: any){
            setError(err.response?.data?.detail || "Registration failed.");
        }
    }
    return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-center mb-6">Register</h2>
        {error && <p>{error}</p>}

        {/* form data */}
        <form onSubmit={handleSubmit} className="text-red-600 text-center mb-3">
            <input 
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 border rounded-md 
            focus:ring focus:ring-blue-300 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />

            <input 
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 border rounded-md 
            focus:ring focus:ring-blue-300 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />

            <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md
            hover:bg-green-700 transition"
            >
                Register
            </button>
        </form>

        {/* ask if already have an account */}
        <p className="text-center text-gray-600 mt-4">
            Already have an account? {" "}
            <Link to='/login' className="text-blue-600 hover:underline" >
            Login
            </Link>
        </p>
      </div>
    </div>
  )
}