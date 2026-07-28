import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
// import "./dashboard.css"
import "../styles/Dashboard.css";

function Dashboard(){
    return(
        <div className='dashboard'>
            <Sidebar/>
        
        <div className='content'>
            <Outlet/>
        </div>
        </div>
    );
}

export default Dashboard