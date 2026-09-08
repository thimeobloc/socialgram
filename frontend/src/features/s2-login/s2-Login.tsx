
import "./login.css";


export default function Registry() {


    return (
        <>

            <div className="Form">

                <h1>Se connecter</h1>

                <input className="formInput" type="email" placeholder="Email"  />

                <input className="formInput" type="password" placeholder="Password" />

                <button className="registryButton" >Se connecter</button>
                    
                <a href="/register">S'inscrire</a>

            </div>

        </>

    )

}