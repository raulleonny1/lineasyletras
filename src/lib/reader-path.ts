export function isRecordReaderPath(pathname: string) {
  return /^\/record\/[^/]+\/leer\/?$/.test(pathname);
}

export function recordReadPath(id: string) {
  return `/record/${id}/leer`;
}
