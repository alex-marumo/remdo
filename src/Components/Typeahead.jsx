//TODO remove
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import "react-bootstrap-typeahead/css/Typeahead.bs5.css";
import { useState } from "react";
import React from "react";

export function TypeaheadPlugin() {
  const [singleSelections, setSingleSelections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState([]);

  const handleSearch = (query) => {
    setIsLoading(true);
    setOptions(["sample", "example"]);
    setIsLoading(false);
  };

  return (
    <AsyncTypeahead
      onChange={setSingleSelections}
      filterBy={() => true}
      placeholder="Type to search search..."
      selected={singleSelections}
      isLoading={isLoading}
      onSearch={handleSearch}
      id="search"
      options={options}
      minLength={1}
    />
  );
}
