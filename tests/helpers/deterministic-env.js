const FIXED_DATE_ISO = '2025-04-18T12:00:00+02:00';

const TEST_CONFIG = {
  openWeather: {
    city: 'Valencia',
    apiKey: 'test-key'
  }
};

const DEFAULT_CURRENT_WEATHER = {
  coord: { lon: -0.3774, lat: 39.4698 },
  weather: [{ id: 800, main: 'Clear', description: 'cielo despejado', icon: '01d' }],
  base: 'stations',
  main: {
    temp: 25,
    feels_like: 26,
    temp_min: 24,
    temp_max: 26,
    humidity: 40,
    pressure: 1015
  },
  visibility: 10000,
  wind: { speed: 2, deg: 100 },
  clouds: { all: 0 },
  dt: 1744966800,
  sys: {
    type: 1,
    id: 6421,
    country: 'ES',
    sunrise: 1744951200,
    sunset: 1744999200
  },
  timezone: 7200,
  id: 2509954,
  name: 'Valencia',
  cod: 200
};

const WEATHER_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f3ede3"/>
  <circle cx="50" cy="50" r="24" fill="#ffb703"/>
  <g stroke="#ffffff" stroke-width="5" stroke-linecap="round">
    <line x1="50" y1="8" x2="50" y2="22"/>
    <line x1="50" y1="78" x2="50" y2="92"/>
    <line x1="8" y1="50" x2="22" y2="50"/>
    <line x1="78" y1="50" x2="92" y2="50"/>
    <line x1="20" y1="20" x2="30" y2="30"/>
    <line x1="70" y1="70" x2="80" y2="80"/>
    <line x1="20" y1="80" x2="30" y2="70"/>
    <line x1="70" y1="30" x2="80" y2="20"/>
  </g>
</svg>`;

const MAP_TILE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#1b2530"/>
  <path d="M0 64h256M0 128h256M0 192h256M64 0v256M128 0v256M192 0v256" stroke="#2a3949" stroke-width="1"/>
</svg>`;

async function setDeterministicClientState(page, options = {}) {
  const {
    lang = 'es',
    darkMode = 'false',
    bannerSubvencionCerrado = 'true'
  } = options;

  await page.addInitScript(({ initialLang, initialDarkMode, initialBannerState }) => {
    localStorage.setItem('lang', initialLang);
    localStorage.setItem('darkMode', initialDarkMode);
    localStorage.setItem('bannerSubvencionCerrado', initialBannerState);
  }, {
    initialLang: lang,
    initialDarkMode: darkMode,
    initialBannerState: bannerSubvencionCerrado
  });
}

function buildForecastList(count = 40) {
  const baseTimestamp = Math.floor(new Date(FIXED_DATE_ISO).getTime() / 1000);

  return Array.from({ length: count }, (_, index) => ({
    dt: baseTimestamp + index * 3 * 60 * 60,
    main: {
      temp: 20,
      feels_like: 19,
      temp_min: 18,
      temp_max: 22,
      humidity: 55,
      pressure: 1012
    },
    weather: [
      {
        icon: '01d',
        description: 'cielo despejado'
      }
    ],
    wind: { speed: 2, deg: 90 },
    clouds: { all: 10 }
  }));
}

async function freezeTime(page, isoString = FIXED_DATE_ISO) {
  await page.addInitScript(({ iso }) => {
    const fixedTime = new Date(iso).getTime();
    const RealDate = Date;

    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedTime);
        } else {
          super(...args);
        }
      }

      static now() {
        return fixedTime;
      }

      static parse(value) {
        return RealDate.parse(value);
      }

      static UTC(...args) {
        return RealDate.UTC(...args);
      }
    }

    Object.defineProperty(MockDate, Symbol.hasInstance, {
      value(instance) {
        return instance instanceof RealDate;
      }
    });

    window.Date = MockDate;
    globalThis.Date = MockDate;
  }, { iso: isoString });
}

async function mockWeatherApi(page, options = {}) {
  const currentWeather = options.currentWeather || DEFAULT_CURRENT_WEATHER;
  const forecastList = options.forecastList || buildForecastList();

  await page.route('**/data/config.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(TEST_CONFIG)
    });
  });

  await page.route('https://api.openweathermap.org/data/2.5/weather**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentWeather)
    });
  });

  await page.route('https://api.openweathermap.org/data/2.5/forecast**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ list: forecastList })
    });
  });

  await page.route('https://openweathermap.org/img/wn/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: WEATHER_ICON_SVG
    });
  });
}

async function mockMapTiles(page) {
  await page.route('https://*.basemaps.cartocdn.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: MAP_TILE_SVG
    });
  });
}

module.exports = {
  FIXED_DATE_ISO,
  DEFAULT_CURRENT_WEATHER,
  buildForecastList,
  freezeTime,
  setDeterministicClientState,
  mockWeatherApi,
  mockMapTiles
};