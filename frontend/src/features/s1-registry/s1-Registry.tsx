export default function Registry() {


    return (
        <>

            <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg">

                <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">S'inscrire</h1>

                <input type="text" placeholder="Username" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                <input type="email" placeholder="Email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                <input type="password" placeholder="Password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                <input type="password" placeholder="Password confirmation" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />

                <button className="w-full py-2 mt-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">S'inscrire</button>

                <a href="/login" className="text-sm text-blue-600 text-center hover:underline mt-2">Se connecter</a>

            </div>

        </>

    )

}