import {
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Setup from "./pages/Setup";

import Dashboard from "./dashboard/Dashboard";

import {
  hasCompletedSetup,
} from "./services/settingsStorage";

function App() {

  // Subscribe to navigation so a privacy reset immediately re-evaluates the
  // saved setup state before routing back to /setup.
  useLocation();

  const setupCompleted =
    hasCompletedSetup();

  return (

    <Routes>

      <Route
        path="/"
        element={
          <Navigate
            to={
              setupCompleted
                ? "/dashboard"
                : "/setup"
            }
            replace
          />
        }
      />

      <Route
        path="/setup"
        element={
          setupCompleted
            ? <Navigate to="/dashboard" replace />
            : <Setup />
        }
      />

      <Route
        path="/dashboard"
        element={
          setupCompleted
            ? <Dashboard />
            : <Navigate to="/setup" replace />
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>

  );

}

export default App;
