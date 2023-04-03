import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="container">
      <nav className="navbar navbar-expand-lg">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a href="/" className="nav-link">
              Home
            </a>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/demo">
              Demo
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/about">
              About
            </NavLink>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}
