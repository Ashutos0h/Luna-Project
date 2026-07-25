import { useState } from "react";

function Setup(){
    const [userName, setUserName] = useState("");
    const [assistantName, setAssistantName] = useState("");
    const [language, setLanguage] = useState("");
    const [profession, setProfession] = useState("");
    const [theme, setTheme]= useState("");

    function handleSubmit() {
        if (!userName.trim()){
            alert("Please enter your Name");
            return;
        }

        if(!assistantName.trim()){
            alert("Please enter assistant name");
            return;
        }
    
    const setupData = {
        userName,
        assistantName,
        language,
        profession,
        theme,
    };

    localStorage.setItem("lunaSetup", JSON.stringify(setupData));

    alert("Setup completed successfully!");
    }

    return(
        <div className="container">
            <h1> Setup Luna</h1>
        
        <form className="setup-form">
        
        <input
        type="text"
        placeholder="Your Name"
        value = {userName}
        onChange={(e)=> setUserName(e.target.value)}
         />

        <input 
         type="text"
         placeholder ="Assitant Name"
         value = {assistantName}
         onChange={(e)=> setAssistantName(e.target.value)}
        />

        <select
        value={language}
        onChange={(e)=> setLanguage(e.target.value)}
        >
            <option>English</option>
            <option>Hindi</option>
            </select>

        <select
        balue ={profession}
        onChange={(e)=> setProfession(e.target.value)}
        >
            <option>Student</option>
            <option>Employee</option>
            <option>Founder</option>
        </select>

        <select
        value={theme}
        onChange={(e)=> setTheme(e.target.value)}
        >
            <option>Light</option>
            <option>Dark</option>
        </select>


        <button onClick={handleSubmit}>
            Continue
        </button>
        </form>
        </div>
    );
    
    
}
export default Setup;