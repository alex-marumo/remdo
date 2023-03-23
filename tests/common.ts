import path from "path";

export function getDataPath(name: string) {
  return path.join(__dirname, "data", name + ".json");
}
