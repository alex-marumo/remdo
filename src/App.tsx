import React from "react";
import Editor from "@/components/Editor";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

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
            <Route path="*" element={<Navigate to="/" />}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
