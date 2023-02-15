import React from "react";
import Editor from "./components/Editor";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";

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
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
