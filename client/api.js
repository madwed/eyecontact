function fetchJson(url) {
  return fetch(url).then((response) => {
    return response.json();
  }).catch(e => console.warn(e));
}

export function attemptMeet ({ id }) {
  return fetchJson(`/meet/${id}`);
}
