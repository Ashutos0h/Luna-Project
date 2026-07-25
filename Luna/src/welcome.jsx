import { useNavigate } from "react-router-dom";


function Welcome(){
    const navigate = useNavigate();
    return(
    <div className="container">
     <h1 className="logo"> Luna</h1>   
     <h2> Your Local AI Desktop Assistant</h2>
          <p>Fast • Private • Intelligent</p>
          

    <button onClick={ ()=> navigate("/setup")}>Get Started</button>
    </div>
)

}


export default Welcome;