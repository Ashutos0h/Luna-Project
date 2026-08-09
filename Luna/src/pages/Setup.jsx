import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Setup.css";

import { saveSettings } from "../services/settingsStorage";

function Setup() {

  const [userName, setUserName] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [language, setLanguage] = useState("");
  const [profession, setProfession] = useState("");
  const [theme, setTheme] = useState("");

  const navigate = useNavigate();

  function handleSubmit(e) {

    e.preventDefault();

    if (!userName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!assistantName.trim()) {
      alert("Please enter assistant name.");
      return;
    }

    if (!language) {
      alert("Please select a language.");
      return;
    }

    if (!profession) {
      alert("Please select a profession.");
      return;
    }

    if (!theme) {
      alert("Please select a theme.");
      return;
    }

    saveSettings({
      userName,
      assistantName,
      language,
      profession,
      theme: theme.toLowerCase(),
      aiModel: "qwen2.5:3b",
    });

    navigate("/dashboard");
  }

  return (

    <div className="setup-container">

      <div className="setup-card">

        <h1>🌙 Setup Luna</h1>

        <p className="setup-subtitle">
          Let's personalize your assistant.
        </p>

        <form
          className="setup-form"
          onSubmit={handleSubmit}
        >

          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) =>
              setUserName(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Assistant Name"
            value={assistantName}
            onChange={(e) =>
              setAssistantName(e.target.value)
            }
          />

          <select
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value)
            }
          >
            <option value="">
              Select Language
            </option>

            <option value="English">
              English
            </option>

            <option value="Hindi">
              Hindi
            </option>

          </select>

          <select
            value={profession}
            onChange={(e) =>
              setProfession(e.target.value)
            }
          >
            <option value="">
              Select Profession
            </option>

            <option value="Student">
              Student
            </option>

            <option value="Employee">
              Employee
            </option>

            <option value="Founder">
              Founder
            </option>

          </select>

          <select
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value)
            }
          >
            <option value="">
              Select Theme
            </option>

            <option value="Dark">
              Dark
            </option>

            <option value="Light">
              Light
            </option>

          </select>

          <button type="submit">
            Continue →
          </button>

        </form>

      </div>

    </div>

  );

}

export default Setup;