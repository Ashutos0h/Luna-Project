import { useState } from "react";

function Welcome(){

    const [started, setStarted] = useState(false);

    const handleClick = () => {
        setStarted(true);
    };

    return(
        <div className="container">
            <h1 className="logo"> Luna</h1>
            {!started ?(
                <>
                <h2> Your Local AI Desktop Assistant</h2>
                <p>
                    Fast. Private. Intelligent
                </p>
             
            
            <button onClick ={handleClick}>
                Get Started
            </button>
               </>
            ):(
                <>
                <h2> Hello Ashu!</h2>

                <p>
                    Let's set up Luna
                </p>

            <button>
                continue
            </button>
                </>
            )}
            
             </div>
    );
}

export default Welcome;