import { useNavigate } from "react-router-dom";
import "../styles/Welcome.css";

function Welcome() {

  const navigate = useNavigate();

  return (
    <div className="welcome-container">

      <div className="welcome-card">

        <h1>Luna</h1>

        <h2>Your Local AI Desktop Assistant</h2>

        <p>
          Fast • Private • Intelligent
        </p>

        <button
          className="start-btn"
          onClick={() => navigate("/setup")}
        >
          Get Started
        </button>

      </div>

    </div>
  );

}

export default Welcome;