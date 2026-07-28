import React from 'react';
import { NavLink } from 'react-router-dom';
import "../styles/Sidebar.css";

function Sidebar(){
    return(
        <div className='sidebar'>
            <h2> Luna</h2>
            <NavLink to= "/dashboard/chat"> Chat</NavLink>
            <NavLink to= "/dashboard/memory"> Memory</NavLink>
            <NavLink to= "/dashboard/setting"> Setting</NavLink>
            <NavLink to= "/dashboard/privacy"> Privacy</NavLink>
        
        <hr />
        <h3>History</h3>
        <p>Todays's chat</p>
        <p>Project Ideas</p>
        <p>History</p>


        </div>
    );
}

export default Sidebar;