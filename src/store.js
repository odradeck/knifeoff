// localStorage 기반 결재 문서 저장소 (백엔드 없음)
const LS_KEY = "knifeoff:documents:v1";

export function loadDocs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch (e) { return []; }
}
export function saveDocs(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
  return arr;
}
export function addDoc(doc) {
  const d = loadDocs();
  d.unshift(doc);
  return saveDocs(d);
}
export function updateDoc(id, patch) {
  const d = loadDocs();
  const i = d.findIndex((x) => x.id === id);
  if (i > -1) d[i] = Object.assign({}, d[i], patch);
  return saveDocs(d);
}
export function resetDocs() {
  localStorage.removeItem(LS_KEY);
  return [];
}
