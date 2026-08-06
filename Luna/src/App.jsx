import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "./Welcome";
import Setup from "./pages/Setup";

import Dashboard from "./Dashboard/Dashboard";

function App() {
  return (
<Routes>
    <Route path="/" element={<Welcome />} />
    <Route path="/setup" element={<Setup />} />
    <Route path="/dashboard" element={<Dashboard />} />
</Routes>
  );
}

export default App;