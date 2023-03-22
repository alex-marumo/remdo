import "./Demo.scss";
import React from "react";

function Window({ transform = null }) {
  return (
    <div className="window" style={{ transform, float: "left" }}>
      <div className="title">
        <div className="float-start">
          <i className="bi bi-record-fill" />
        </div>
        sample window
      </div>
      <div className="content">
        Window content sample notes
        <br />
        {transform}
      </div>
    </div>
  );
}

export function Demo() {
  return (
    <div>
      <div className="mirror">
        <span className="text">Some text written on the mirror</span>
      </div>
      <br />
      <br />
      <Window transform="perspective(150px) rotateX(0deg) rotateY(10deg)" />
      <br />
      <Window transform="perspective(100px) rotateX(0deg) rotateY(-10deg)" />

      
      
    </div>
  );
}
