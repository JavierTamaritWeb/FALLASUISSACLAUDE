// js/meteo.js

// Variable global para almacenar la configuración (config.json)
let configData = null;

/**
 * Función para obtener los parámetros de la API de OpenWeather
 * según el idioma seleccionado.
 * - Para "en": units = imperial, lang = en
 * - Para "va": units = metric, lang = ca (OpenWeather usa "ca" para el valenciano)
 * - Para "fr": units = metric, lang = fr
 * - Para "es": units = metric, lang = es
 */
function getWeatherParams() {
  let units, langParam;
  if (currentLang === 'en') {
    units = "imperial";
    langParam = "en";
  } else if (currentLang === 'va') {
    units = "metric";
    langParam = "ca";
  } else if (currentLang === 'fr') {
    units = "metric";
    langParam = "fr";
  } else {
    units = "metric";
    langParam = "es";
  }
  return { units, lang: langParam };
}

/**
 * Función auxiliar para determinar la configuración regional (locale)
 * según el idioma seleccionado.
 */
function getLocaleFromLang() {
  switch (currentLang) {
    case 'va':
      return 'ca-ES'; // Valenciano (Catalán)
    case 'en':
      return 'en-US';
    case 'fr':
      return 'fr-FR';
    default:
      return 'es-ES';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1) Cargar config.json
    const res = await fetch('data/config.json');
    configData = await res.json();

    // 2) Si la página tiene secciones de clima, realizar las llamadas a la API.
    if (document.querySelector('.weather-current')) {
      fetchCurrentWeather();
    }
    if (document.querySelector('.forecast-day')) {
      fetchForecast();
    }

    // 3) Iniciar animaciones (si anime.js está definido)
    initAnimations();
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
});

// Escucha un evento personalizado "langChanged" para actualizar los datos meteorológicos
document.addEventListener('langChanged', () => {
  if (document.querySelector('.weather-current')) {
    fetchCurrentWeather();
  }
  if (document.querySelector('.forecast-day')) {
    fetchForecast();
  }
});

/**
 * Obtiene el clima actual usando la API de OpenWeather y llama a updateCurrentWeather.
 */
async function fetchCurrentWeather() {
  if (!configData) return;
  const { city, apiKey } = configData.openWeather;
  const params = getWeatherParams();
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${params.units}&lang=${params.lang}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    updateCurrentWeather(data);
  } catch (error) {
    console.error('Error al obtener el clima actual:', error);
  }
}

/**
 * Obtiene la previsión a 5 días usando la API de OpenWeather y llama a updateForecast.
 */
async function fetchForecast() {
  if (!configData) return;
  const { city, apiKey } = configData.openWeather;
  const params = getWeatherParams();
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${params.units}&lang=${params.lang}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    updateForecast(data);
  } catch (error) {
    console.error('Error al obtener la previsión:', error);
  }
}

/**
 * Actualiza la sección de Clima Actual (solo si existe en el DOM)
 */
function updateCurrentWeather(data) {
  if (!document.querySelector('.weather-current')) return;

  const {
    weather,
    main: { temp, feels_like, temp_min, temp_max, humidity, pressure },
    clouds: { all: cloudiness },
    visibility,
    wind: { speed = 0, deg = 0 } = {},
    rain,
    snow,
    sys: { sunrise, sunset }
  } = data;

  const icon = weather && weather[0] ? weather[0].icon : '01d';
  const desc = weather && weather[0] ? weather[0].description : 'N/A';
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  const rain1h = (rain && rain["1h"]) ? `${rain["1h"]} mm` : '0 mm';
  const rain3h = (rain && rain["3h"]) ? `${rain["3h"]} mm` : '0 mm';
  const snow1h = (snow && snow["1h"]) ? `${snow["1h"]} mm` : '0 mm';
  const snow3h = (snow && snow["3h"]) ? `${snow["3h"]} mm` : '0 mm';

  const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const sunsetTime = new Date(sunset * 1000).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Elementos del DOM
  const iconImg       = document.getElementById('current-icon-img');
  const tempElem      = document.getElementById('current-temp');
  const descElem      = document.getElementById('current-desc');
  const feelsElem     = document.getElementById('current-feels-like');
  const minmaxElem    = document.getElementById('current-minmax');
  const humElem       = document.getElementById('current-humidity');
  const pressElem     = document.getElementById('current-pressure');
  const cloudsElem    = document.getElementById('current-clouds');
  const visElem       = document.getElementById('current-visibility');
  const windSpeedElem = document.getElementById('current-wind-speed');
  const windDegElem   = document.getElementById('current-wind-deg');
  const rain1hElem    = document.getElementById('current-rain-1h');
  const rain3hElem    = document.getElementById('current-rain-3h');
  const snow1hElem    = document.getElementById('current-snow-1h');
  const snow3hElem    = document.getElementById('current-snow-3h');
  const sunrElem      = document.getElementById('current-sunrise');
  const sunsElem      = document.getElementById('current-sunset');

  if (iconImg) {
    // Reset classes state
    iconImg.classList.remove('error');
    iconImg.classList.remove('loaded');
    iconImg.classList.remove('animate-icon'); // Remove old class
    iconImg.classList.remove('weather-animate-in'); // Ensure defined start state

    const handleImageLoad = () => {
      iconImg.classList.add('loaded');
      // Trigger new specific animation
      iconImg.classList.remove('weather-animate-in');
      void iconImg.offsetWidth; // Force reflow
      iconImg.classList.add('weather-animate-in');
      
      iconImg.removeEventListener('load', handleImageLoad);
    };

    // Set new source
    iconImg.src = iconUrl;
    iconImg.alt = desc;

    if (iconImg.complete) {
      handleImageLoad();
    } else {
      iconImg.addEventListener('load', handleImageLoad);
    }
  }
  if (tempElem)      { tempElem.textContent = `${Math.round(temp)}°C`; }
  if (descElem)      { descElem.textContent = capitalize(desc); }
  if (feelsElem)     { 
    feelsElem.textContent = `${translate("meteo.sensacion")}: ${Math.round(feels_like)}°C`; 
  }
  if (minmaxElem)    { 
    minmaxElem.textContent = `${translate("meteo.min") || "Mín"}: ${Math.round(temp_min)}°C / ${translate("meteo.max") || "Máx"}: ${Math.round(temp_max)}°C`; 
  }
  if (humElem)       { humElem.textContent = `${humidity}%`; }
  if (pressElem)     { pressElem.textContent = `${pressure} hPa`; }
  if (cloudsElem)    { 
    cloudsElem.textContent = `${translate("meteo.nubosidad") || "Nubosidad"}: ${cloudiness}%`; 
  }
  if (visElem)       { visElem.textContent = `${(visibility / 1000).toFixed(1)} km`; }
  if (windSpeedElem) { 
    windSpeedElem.textContent = `${translate("meteo.viento") || "Viento"}: ${speed} m/s`; 
  }
  if (windDegElem)   { 
    windDegElem.textContent = `${translate("meteo.direccion") || "Dirección"}: ${deg}°`; 
  }
  if (rain1hElem)    { 
    rain1hElem.textContent = `${translate("meteo.lluvia1h") || "Lluvia (1h)"}: ${rain && rain["1h"] ? rain["1h"] : 0} mm`; 
  }
  if (rain3hElem)    { 
    rain3hElem.textContent = `${translate("meteo.lluvia3h") || "Lluvia (3h)"}: ${rain && rain["3h"] ? rain["3h"] : 0} mm`; 
  }
  if (snow1hElem)    { 
    snow1hElem.textContent = `${translate("meteo.nieve1h") || "Nieve (1h)"}: ${snow && snow["1h"] ? snow["1h"] : 0} mm`; 
  }
  if (snow3hElem)    { 
    snow3hElem.textContent = `${translate("meteo.nieve3h") || "Nieve (3h)"}: ${snow && snow["3h"] ? snow["3h"] : 0} mm`; 
  }
  if (sunrElem)      { 
    sunrElem.textContent = `${translate("meteo.amanecer") || "Amanecer"}: ${sunriseTime}`; 
  }
  if (sunsElem)      { 
    sunsElem.textContent = `${translate("meteo.atardecer") || "Atardecer"}: ${sunsetTime}`; 
  }
}

/**
 * Actualiza las 5 tarjetas de la previsión (si existen) con los datos recibidos.
 */
function updateForecast(data) {
  if (!document.querySelector('.forecast-day')) return;

  const dailyData = [];
  for (let i = 0; i < data.list.length; i += 8) {
    dailyData.push(data.list[i]);
  }
  const forecast5 = dailyData.slice(0, 5);

  forecast5.forEach((item, index) => {
    const dayIndex = index + 1;
    // Asignar valores por defecto para wind
    const { dt, main, weather, wind = { speed: 0, deg: 0 }, clouds } = item;
    const dateObj = new Date(dt * 1000);
    // Utilizar la configuración regional dinámica
    const dateStr = dateObj.toLocaleDateString(
      getLocaleFromLang(),
      { weekday: 'long', day: 'numeric', month: 'short' }
    );
    const icon = weather[0].icon;
    const desc = weather[0].description;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const dateElem   = document.getElementById(`forecast-day-${dayIndex}-date`);
    const iconElem   = document.getElementById(`forecast-day-${dayIndex}-icon`);
    const descElem   = document.getElementById(`forecast-day-${dayIndex}-desc`);
    const tempElem   = document.getElementById(`forecast-day-${dayIndex}-temp`);
    const minmaxElem = document.getElementById(`forecast-day-${dayIndex}-minmax`);
    const windElem   = document.getElementById(`forecast-day-${dayIndex}-wind`);
    const cloudElem  = document.getElementById(`forecast-day-${dayIndex}-clouds`);

    if (dateElem)   { dateElem.textContent = capitalize(dateStr); }
    if (iconElem)   { iconElem.src = iconUrl; iconElem.alt = desc; }
    if (descElem)   { descElem.textContent = capitalize(desc); }
    if (tempElem)   { tempElem.textContent = `${Math.round(main.temp)}°C`; }
    if (minmaxElem) { 
      minmaxElem.textContent = `${translate("meteo.min") || "Mín"}: ${Math.round(main.temp_min)}°C / ${translate("meteo.max") || "Máx"}: ${Math.round(main.temp_max)}°C`; 
    }
    if (windElem)   { 
      windElem.textContent = `${translate("meteo.viento") || "Viento"}: ${wind.speed} m/s`; 
    }
    if (cloudElem)  { 
      cloudElem.textContent = `${translate("meteo.nubosidad") || "Nubosidad"}: ${clouds.all}%`; 
    }
  });
}

/**
 * Inicializa animaciones usando anime.js (si la librería está disponible).
 */
function initAnimations() {
  if (typeof anime !== 'function') {
    console.warn("anime.js no está definido, se omiten animaciones.");
    return;
  }
  if (document.querySelector('.forecast-day')) {
    anime({
      targets: '.forecast-day',
      opacity: [0, 1],
      translateY: [-20, 0],
      delay: anime.stagger(100)
    });
  }
}

// Función para capitalizar la primera letra de una cadena
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}