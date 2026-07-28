import { Routes, Route } from "react-router-dom";

import Welcome from "./welcome";
import Setup from "./Setup";

import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Memory from "./pages/Memory";
import Setting from "./pages/Setting";
import Privacy from "./pages/Privacy";

function App() {
  return (
    <Routes>

      {/* Welcome Page */}
      <Route path="/" element={<Welcome />} />

      {/* Setup Page */}
      <Route path="/setup" element={<Setup />} />

      {/* Dashboard Layout */}
      <Route path="/dashboard" element={<Dashboard />}>

        {/* Default Page */}
        <Route index element={<Chat />} />

        {/* Sidebar Navigation Pages */}
        <Route path="chat" element={<Chat />} />
        <Route path="memory" element={<Memory />} />
        <Route path="setting" element={<Setting />} />
        <Route path="privacy" element={<Privacy />} />

      </Route>

    </Routes>
  );
}

export default App;