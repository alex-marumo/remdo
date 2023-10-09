import { Provider } from "@lexical/yjs";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";

let yIDB = null;
if ("indexedDB" in window) {
  //import conditionally, because it breaks unit tests, where indexedDB is
  //neither available nor used
  yIDB = import("y-indexeddb");
}

export function providerFactory(id: string, yjsDocMap: Map<string, Doc>): Provider {
  //console.log("providerFactory", id);
  let doc = yjsDocMap.get(id);

  if (doc === undefined) {
    doc = new Doc();
    yjsDocMap.set(id, doc);
  } else {
    doc.load();
  }

  if ("indexedDB" in window) {
    yIDB.then(({ IndexeddbPersistence }) => {
      new IndexeddbPersistence(id, doc);
    });
  } else if (!("__vitest_environment__" in globalThis)) {
    console.warn(
      "IndexedDB is not supported in this browser. Disabling offline mode."
    );
  }

  const wsURL = "ws://" + window.location.hostname + ":8080";
  const roomName = "notes/0/" + id;
  //console.log(`WebSocket URL: ${wsURL}/${roomName}`)
  const wsProvider = new WebsocketProvider(wsURL, roomName, doc, {
    connect: true,
  });
  wsProvider.shouldConnect = true; //reconnect after disconnecting

  /*
  const events = ["status", "synced", "sync", "update", "error", "destroy", "reload"];
  events.forEach((event) => {
    wsProvider.on(event, () => {
      console.log("wsProvider", event);
    });
  });
  */

  // @ts-ignore
  return wsProvider;
}
