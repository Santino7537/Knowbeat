function Form_card(information){

    return(
        <div>
            <section>
                <h2>
                    {information.title}
                </h2>
            </section>
            <section>
                <div>
                    <p>Email</p>
                    <input type="text" name="" id="" />
                </div>
                <div>
                    <p>Contraseña</p>
                    <input type="password" />
                </div>    
            </section>
        </div>
    )
}

export default Form_card