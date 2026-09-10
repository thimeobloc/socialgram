import { useState } from "react";
import { registerResponseSchema } from "./registry.schema"

export default function Registry() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [errors, setError] = useState({
        username: "",
        email: "",
        password: "",
        passwordConfirmation: "",
        general: "",
    });

    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEmpty =
        !username &&
        !email &&
        !password &&
        !passwordConfirmation;

    async function register(username: string, email: string, password: string, passwordConfirmation: string) {

        setError({
            username: "",
            email: "",
            password: "",
            passwordConfirmation: "",
            general: "",
        });

        setSuccess(false);

        if (!username) {
            setError((prev) => ({
                ...prev,
                username: "Le nom d'utilisateur est obligatoire",
            }));
            return;
        }

        if (!email) {
            setError((prev) => ({
                ...prev,
                email: "L'email est obligatoire",
            }));
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError((prev) => ({
                ...prev,
                email: "L'email est invalide",
            }));
            return;
        }

        if (!password) {
            setError((prev) => ({
                ...prev,
                password: "Le mot de passe est obligatoire",
            }));
            return;
        }

        if (
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[^A-Za-z0-9]/.test(password)
        ) {
            setError((prev) => ({
                ...prev,
                password:
                    "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 chiffre et 1 caractère spécial",
            }));
            return;
        }

        if (password !== passwordConfirmation) {
            setError((prev) => ({
                ...prev,
                passwordConfirmation: "Les mots de passes ne correspondent pas ",
            }));
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:3000/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                    }),
                }
            );

            const rawData = await response.json();

            const parsedData = registerResponseSchema.safeParse(rawData);

            if (!parsedData.success) {
                setError((prev) => ({
                    ...prev,
                    general: "Réponse du serveur invalide",
                }));
                return;
            }

            const data = parsedData.data;

            if (!response.ok) {
                if (data.error === "Email already used") {
                    setError((prev) => ({
                        ...prev,
                        email: "Cet email est déjà utilisé",
                    }));
                    return;
                }

                if (data.error === "Username already used") {
                    setError((prev) => ({
                        ...prev,
                        username: "Ce nom d'utilisateur est déjà utilisé",
                    }));
                    return;
                }

                setError((prev) => ({
                    ...prev,
                    general: data.error || "Une erreur est survenue",
                }));

                return;
            }

            setSuccess(true);

        } catch {
            setError((prev) => ({
                ...prev,
                general: "Impossible de contacter le serveur",
            }));
            return;

        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg">

                <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">S'inscrire</h1>

                {isEmpty && !loading && !success && (
                    <p>
                        Remplissez les champs pour créer votre compte.
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                />

                {errors.username && (
                    <p className="text-red-500">
                        {errors.username}
                    </p>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />

                {errors.email && (
                    <p className="text-red-500">
                        {errors.email}
                    </p>
                )}

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />

                {errors.password && (
                    <p className="text-red-500">
                        {errors.password}
                    </p>
                )}

                <input
                    type="password"
                    placeholder="Password confirmation"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    disabled={loading}
                />

                {errors.passwordConfirmation && (
                    <p className="text-red-500">
                        {errors.passwordConfirmation}
                    </p>
                )}

                {success && (
                    <p className="text-green-500"> Compte créé avec succès ! </p>
                )}

                {loading && (
                    <p>Création de votre compte...</p>
                )}

                {errors.general && (
                    <p className="text-red-500">
                        {errors.general}
                    </p>
                )}

                <button
                    className="w-full py-2 mt-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() =>
                        register(
                            username,
                            email,
                            password,
                            passwordConfirmation
                        )
                    }
                    disabled={loading}
                >
                    {loading ? "Inscription..." : "S'inscrire"}
                </button>

                <a href="/login" className="text-sm text-blue-600 text-center hover:underline mt-2"> Se connecter</a>
            </div>
        </>
    );
}