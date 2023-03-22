import "./App.scss";
import { Demo } from "./components/Demo";
import { Layout } from "./components/Layout";
import Editor from "@/components/Editor";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route element={<Editor />}>
              <Route path="" element="</>" index></Route>
              <Route path="note/:noteID" element="</>"></Route>
            </Route>
            <Route path="about" element={<div>About</div>} />
            <Route path="demo" element={<Demo />} />
            <Route path="*" element={<Navigate to="/" />}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
