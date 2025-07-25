import "./TopNavBar.scss";
import { Nav } from "react-bootstrap";
import { useDebug } from "@/DebugContext";
import { NavLink } from "react-router-dom";

function Logo() {
  return (
    <a className="navbar-brand" href="/">
      <span className="logo">
        <svg
          height="1em"
          version="1.1"
          viewBox="0 0 1585.728 1704"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1424.627,0H332.854C244.039,0,171,71.166,171,159.98V307H66.071C29.58,307,0,336.51,0,373c0,36.49,29.58,66,66.071,66H171   v347H66.071C29.58,786,0,815.509,0,852c0,36.49,29.58,66,66.071,66H171v343H66.071C29.58,1261,0,1291.01,0,1327.5   s29.58,66.5,66.071,66.5H171v148.465C171,1631.279,244.039,1704,332.854,1704h641.689c17.521,0,34.329-7.189,46.717-19.584   l544.738-545.201c12.395-12.389,19.002-29.313,19.002-46.834v-932.4C1585,71.166,1513.442,0,1424.627,0z M303,1542.465V1394   h113.246c36.491,0,66.071-30.01,66.071-66.5s-29.58-66.5-66.071-66.5H303V918h113.246c36.491,0,66.071-29.51,66.071-66   c0-36.491-29.58-66-66.071-66H303V439h113.246c36.491,0,66.071-29.509,66.071-66c0-36.491-29.58-66-66.071-66H303V159.98   c0-15.95,13.904-27.98,29.854-27.98h1091.773c15.95,0,28.373,12.03,28.373,27.98V994h-416.496   C947.692,994,875,1065.529,875,1154.344V1572H332.854C316.904,1572,303,1558.414,303,1542.465z M1007,1510.99v-356.646   c0-15.949,13.554-28.344,29.504-28.344h356.649L1007,1510.99z" />
        </svg>
      </span>
      RemDo
    </a>
  );
}

export function TopNavBar() {
  const { isDebugMode, toggleDebugMode } = useDebug();

  return (
      <nav className="navbar navbar-expand-lg">
        <Logo />
        <NavLink className="nav-link" to="/dev">
          Dev
        </NavLink>
        <NavLink className="nav-link" to="/about">
          About
        </NavLink>
        <Nav.Link
          className="nav-link ms-auto"
          onClick={toggleDebugMode}
          id="debug-toggle"
        >
          Debug: {isDebugMode ? "On" : "Off"}
        </Nav.Link>
      </nav>
  );
}
