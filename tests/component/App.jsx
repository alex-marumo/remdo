import React from "react";
import Editor from "../../src/Components/Editor";
import PropTypes from "prop-types";

export default function App({ testHandler }) {
  return (
    <div className="App">
      <Editor testHandler={testHandler} />
    </div>
  );
}

App.propTypes = {
  testHandler: PropTypes.object,
};
