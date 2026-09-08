import { useState } from "react";

export default function Registry() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState("");

    //Fonction qui envoie au back 
    async function register(username: string, email: string, password: string, passwordConfirmation: string) {

        if (!username) {
            setError("Le nom d'utilisateur est obligatoire");
            return;
        }

        if (!email) {
            setError("L'email est obligatoire");
            return;
        }

        if (!password) {
            setError("Le mot de passe est obligatoire");
            return;
        }

        if (password !== passwordConfirmation) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        const response = await fetch("http://localhost:3000/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                email,
                password,
            }),
        });

        const data = await response.json();

        if (data.error) {
            setError(data.error)
        }
        else {
            console.log("utilisateur crée")
        }


    }


    return (
        <>
            <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg">

                <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">S'inscrire</h1>

                <input type="text" placeholder="Username" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={username} onChange={(e) => setUsername(e.target.value)} />

                <input type="email" placeholder="Email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} />

                <input type="password" placeholder="Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />

                <input type="password" placeholder="Password confirmation" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />

                <p>{error}</p>

                <button className="w-full py-2 mt-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors" onClick={() => register(username, email, password, passwordConfirmation)}>S'inscrire</button>

                <a href="/login" className="text-sm text-blue-600 text-center hover:underline mt-2">Se connecter</a>

            </div>

        </>

    )

}