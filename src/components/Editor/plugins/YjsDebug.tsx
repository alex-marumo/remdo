import { useDocumentSelector } from "@/components/DocumentSelector";
import ReactJson from "@microlink/react-json-view";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";

type YElement = Y.AbstractType<any>;

// eslint-disable-next-line @typescript-eslint/ban-types
function yXmlTextToJSON(value: Y.XmlText): Object {
  let result = [];

  for (let item = value._start; item !== null; item = item.right) {
    if (item.deleted) {
      continue;
    }
    console.log("item", yjsToJSON(item.content));
    //result.push(yjsToJSON(item.content));
    result.push("sample");
  }
  return result;

  value
    .toDelta()
    .forEach(
      (delta: {
        attributes: { [x: string]: { [x: string]: any } };
        insert: Y.AbstractType<Y.YEvent<any>>;
      }) => {
        const nestedNodes = [];
        for (const nodeName in delta.attributes) {
          const attrs = [];
          for (const key in delta.attributes[nodeName]) {
            attrs.push({ key, value: delta.attributes[nodeName][key] });
          }
          // sort attributes to get a unique order
          attrs.sort((a, b) => (a.key < b.key ? -1 : 1));
          nestedNodes.push({ nodeName, attrs });
        }
        // sort node order to get a unique order
        nestedNodes.sort((a, b) => (a.nodeName < b.nodeName ? -1 : 1));
        for (let i = 0; i < nestedNodes.length; i++) {
          const node = nestedNodes[i];
          result.push(`<${node.nodeName}`);
          for (let j = 0; j < node.attrs.length; j++) {
            const attr = node.attrs[j];
            result.push(` ${attr.key}="${attr.value}"`);
          }
          result.push(">");
        }
        result.push(yjsToJSON(delta.insert));
        for (let i = nestedNodes.length - 1; i >= 0; i--) {
          result.push(`</${nestedNodes[i].nodeName}>`);
        }
      }
    );
  //flatten the array
  while (Array.isArray(result) && result.length === 1) {
    result = result[0];
  }
  if (
    result.length === 2 &&
    result[0] instanceof Object &&
    typeof result[1] === "string"
  ) {
    //node properties & text
    result[0]["text"] = result[1];
    result.splice(1, 1);
  } else if (
    result.length === 3 &&
    result[0] instanceof Object &&
    typeof result[1] === "string" &&
    result[2] instanceof Object
  ) {
    //node properties & text & children
    result[0]["text"] = result[1];
    result[0]["children"] = result[2];
    result.splice(1, 2);
  }
  return result;
}

function yMapToJSON(value: Y.Map<any>): object {
  const result = {};
  value._map.forEach((item, key) => {
    if (!item.deleted) {
      const v = item.content.getContent()[item.length - 1];
      result[key] = yjsToJSON(v);
    }
  });
  return result;
}

function yjsToJSON(value: YElement): object {
  let result: object;
  if (value instanceof Y.XmlText) {
    result = yXmlTextToJSON(value);
  } else if (value instanceof Y.Map) {
    result = yMapToJSON(value);
    //} else if (value instanceof Y.XmlElement || value instanceof Y.XmlFragment) {
    //  result = `XML:${value.toString()}`;
    //} else if (value instanceof Y.Array) {
    //  result = `Array:${value.toArray()}`;
  } else {
    result = value;
  }
  return result;
}

export function YjsDebug() {
  return;
  const documentSelector = useDocumentSelector();
  const documentElements = useRef(new Map());
  const [documentData, setDocumentData] = useState({});

  const refreshDocumentElements = useCallback(() => {
    const newDocumentElements = documentSelector.getYjsDoc().share;

    const update = Y.encodeStateAsUpdate(documentSelector.getYjsDoc());
    //Y.logUpdate(update);

    //setDocumentData(yjsToJSON(newDocumentElements));
    newDocumentElements.forEach((value, key) => {
      setDocumentData((prev) => {
        return { ...prev, [key]: yjsToJSON(value) };
      });
    });
    documentElements.current.forEach((value: YElement, key: string) => {
      if (!newDocumentElements.get(key)) {
        setDocumentData((prev) => {
          const newDocumentData = { ...prev };
          delete newDocumentData[key];
          return newDocumentData;
        });
      }
    });

    //newDocumentElements.forEach((value, key) => {
    //  if (!documentElements.current.get(key)) {
    //    value.observeDeep(refreshElement);
    //  }
    //});
    //documentElements.current.forEach((value: YElement, key: string) => {
    //  if (!newDocumentElements.get(key)) {
    //    value.unobserveDeep(refreshElement);
    //  }
    //});
    documentElements.current = newDocumentElements;
  }, [documentSelector, documentElements]);

  const refreshElement = (events: Array<Y.YEvent<any>>) => {
    events.forEach((event) => {
      console.log("Event: ", event);
    });
  };

  useEffect(() => {
    const provider = documentSelector.getYjsProvider();
    const doc = documentSelector.getYjsDoc();

    //FIXME one of the two?
    provider?.on("sync", refreshDocumentElements);
    doc?.on("update", refreshDocumentElements);
    refreshDocumentElements(); //to show the content when the component is mounted

    return () => {
      provider?.off("sync", refreshDocumentElements);
      doc?.off("update", refreshDocumentElements);
    };
  }, [documentSelector, refreshDocumentElements]);

  return (
    <div>
      <div className="text-white font-weight-bold">Yjs Info</div>
      <div>DocumentID: {documentSelector.documentID}</div>
      <div>
        <ReactJson
          src={documentData}
          name={null}
          displayObjectSize={false}
          displayDataTypes={false}
          quotesOnKeys={false}
          theme="ashes"
        />
      </div>
      <br />
    </div>
  );
}
