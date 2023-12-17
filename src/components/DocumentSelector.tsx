import { NotesState } from "./Editor/api";
import React, { createContext, useContext, useState } from "react";
import { Dropdown, NavDropdown } from "react-bootstrap";

interface DocumentSelectorType {
  documentID: string;
  setDocumentID: (id: string) => void;
}

const DocumentSelectorContext = createContext<DocumentSelectorType>(null);

export const useDocumentSelector = () => {
  const context = useContext(DocumentSelectorContext);
  if (!context) {
    throw new Error(
      "useDocumentSelector must be used within a DocumentSelectorProvider"
    );
  }
  return context;
};

export const DocumentSelectorProvider = ({ children }) => {
  const [documentID, setDocumentID] = useState("main");

  return (
    <DocumentSelectorContext.Provider value={{ documentID, setDocumentID }}>
      {children}
    </DocumentSelectorContext.Provider>
  );
};

export function DocumentSelector() {
  const { setDocumentID } = useDocumentSelector();

  return (
    <div data-testid="document-selector">
      <NavDropdown title="Documents">
        {NotesState.documents().map((document) => (
          <Dropdown.Item
            href={`?documentID=${document}`}
            key={document}
            onClick={(e) => {
              e.preventDefault();
              setDocumentID(document);
            }}
          >
            {document}
          </Dropdown.Item>
        ))}
      </NavDropdown>
    </div>
  );
}
