
import "../../css/registry.css";

export default function Registry() {


    return (
        <>

            <div className="Form">

                <h1>S'inscrire</h1>

                <input className="formInput" type="text" placeholder="Username"/>

                <input className="formInput" type="email" placeholder="Email"  />

                <input className="formInput" type="password" placeholder="Password" />

                <input className="formInput" type="password" placeholder="Password confirmation"  />

                <button className="registryButton" >S'inscrire</button>

                <a href="/login">Se connecter</a>

            </div>

        </>

    )

}