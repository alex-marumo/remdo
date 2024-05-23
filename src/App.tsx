import "./App.scss";
import { DebugProvider } from "./DebugContext";
import { Layout } from "./components/Layout";
import Editor from "@/components/Editor/Editor";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dev } from "./components/Dev/Dev";
import { Yjs } from "./components/Dev/Yjs";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <DebugProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route element={<Editor />}>
                <Route path="" element="</>" index></Route>
                <Route path="note/:noteID" element="</>"></Route>
              </Route>
              <Route path="about" element={<div>About</div>} />
              <Route path="dev">
                <Route path="" element={<Dev />} index></Route>
                <Route path="yjs" element={<Yjs />} />
              </Route>
            </Route>
          </Routes>
        </DebugProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
