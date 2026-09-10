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
        <div className="flex flex-col items-center max-w-sm mx-auto mt-16 px-4">
            <p className="font-display text-4xl uppercase text-brand">Groupy</p>
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-slate">
                Find your group
            </p>

            <div className="flex w-full flex-col gap-4 p-8 bg-white border border-cream rounded-2xl shadow-sm">

                <h1 className="font-display text-2xl uppercase text-ink text-center mb-2">S'inscrire</h1>

                {isEmpty && !loading && !success && (
                    <p className="text-sm text-slate">
                        Remplissez les champs pour créer votre compte.
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Username"
                    className="w-full px-4 py-2 border border-cream bg-paper text-ink rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                    className="w-full px-4 py-2 border border-cream bg-paper text-ink rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                    className="w-full px-4 py-2 border border-cream bg-paper text-ink rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                    className="w-full px-4 py-2 border border-cream bg-paper text-ink rounded-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                    <p className="text-green-600"> Compte créé avec succès ! </p>
                )}

                {loading && (
                    <p className="text-sm text-slate">Création de votre compte...</p>
                )}

                {errors.general && (
                    <p className="text-red-500">
                        {errors.general}
                    </p>
                )}

                <button
                    className="w-full py-2.5 mt-2 bg-brand text-white font-semibold rounded-full hover:bg-brand-dark transition-colors disabled:opacity-50"
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

                <a href="/login" className="text-sm font-medium text-brand text-center hover:underline mt-1"> Se connecter</a>
            </div>
        </div>
    );
}