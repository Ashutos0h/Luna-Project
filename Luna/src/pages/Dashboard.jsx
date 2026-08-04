import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">

      <Sidebar
        conversations={[]}
        activeChatId={null}
        onSelectConversation={() => {}}
        onNewChat={() => {}}
      />

      <div className="content">
        <Outlet />
      </div>

    </div>
  );
}

export default Dashboard;