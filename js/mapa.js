// Definir límites para Web Mercator: Sur: -85.0511, Norte: 85.0511, Oeste: -180, Este: 180.
const bounds = [[-85.0511, -180], [85.0511, 180]];

const map = L.map('map', {
  fullscreenControl: true,
  maxBounds: bounds // Se restringe el desplazamiento a estos límites.
}).setView([45, 5], 4);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors & CartoDB',
  subdomains: 'abcd',
  maxZoom: 19,
  noWrap: true, // Se mantiene para evitar la repetición.
  bounds: bounds  // Se establece para que solo se soliciten tiles dentro de estos límites.
}).addTo(map);

L.easyButton('fa-crosshairs', function () {
  map.setView([45, 5], 4);
}, 'Recentrar mapa').addTo(map);

const ciudades = {
  'Valencia': [39.4699, -0.3763],
  'Madrid': [40.4168, -3.7038]
  // 'Berlín': [52.52, 13.405],
  // 'París': [48.8566, 2.3522]
};

for (const [nombre, coords] of Object.entries(ciudades)) {
  const marker = L.marker(coords, {
    icon: L.divIcon({
      className: 'custom-marker',
      iconSize: [18, 18]
    }),
    title: nombre
  }).addTo(map);
  marker.bindPopup(`<strong>${nombre}</strong>`);
}