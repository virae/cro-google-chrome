document.addEventListener('DOMContentLoaded', () => {
  const API_URL = "http://data.rozhlas.cz/api/v2/";
  let view = 'stations';
  let stations = [];

  function init() {
    fetch(API_URL + "meta/radioconfig.json", {
        cache: 'force-cache'
      })
      .then(response => response.json())
      .then(data => {
        stations = data.data.station.filter(station => station["@attributes"].type == "celoplošná");
        stations.forEach(station => getCurrentShow(station));

        const currentStation = localStorage.getItem('station');
        if (currentStation !== null) {
          stations[currentStation].isPlaying = true;
        }
        renderStations();
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  function reset() {
    stations.forEach(station => {
      station.isPlaying = false;
      station.isBuffering = false;
    });
  }

  function play(station, index) {
    if (station.isPlaying || station.isBuffering) {
      chrome.runtime.sendMessage({
        action: "stop"
      });
      localStorage.removeItem('station');
      reset();
    } else {
      const streamInfo = station.audio.directstream.item.find(item => item["@attributes"].type == "mp3" && item["@attributes"].bitrate == 128);
      const stream = streamInfo["@attributes"].url;
      chrome.runtime.sendMessage({
        action: "play",
        station: station,
        index: index,
        stream: stream
      });
      localStorage.setItem('station', index);
      reset();
    }
    renderStations();
  }

  function getCurrentShow(station) {
    const parts = [
      "schedule/day",
      new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
      station["@attributes"].kod_webu
    ];
    const url = API_URL + parts.join("/") + ".json";

    fetch(url, {
        cache: 'force-cache'
      })
      .then(response => response.json())
      .then(data => {
        const now = new Date();
        for (let i = 0; i < data.data.length; i++) {
          const since = new Date(data.data[i].since);
          const till = new Date(data.data[i].till);
          if (now >= since && now < till) {
            station.nowplaying = data.data[i].title;
            break;
          }
        }
        renderStations();
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  function toggleView() {
    view = view === 'stations' ? 'about' : 'stations';
    document.body.style.minHeight = view === 'stations' ? '489px' : '0';
    renderView();
  }

  function renderStations() {
    const stationsContainer = document.getElementById('stations');
    stationsContainer.innerHTML = '';

    stations.forEach((station, index) => {
      const stationElement = document.createElement('div');
      stationElement.className = 'station';
      if (station.isPlaying) stationElement.classList.add('is-playing');
      if (station.isBuffering) stationElement.classList.add('is-buffering');
      stationElement.style.color = station.color;
      stationElement.addEventListener('click', () => play(station, index));

      const iconElement = document.createElement('div');
      iconElement.className = 'station-icon icon icon-logo';
      stationElement.appendChild(iconElement);

      const infoElement = document.createElement('div');
      infoElement.className = 'station-info';
      stationElement.appendChild(infoElement);

      const nameElement = document.createElement('div');
      nameElement.className = 'station-name';
      nameElement.textContent = station.shortname;
      infoElement.appendChild(nameElement);

      const showElement = document.createElement('div');
      showElement.className = 'station-show';
      showElement.textContent = station.nowplaying || '...';
      infoElement.appendChild(showElement);

      stationElement.appendChild(document.createElement('span'));

      stationsContainer.appendChild(stationElement);
    });
  }

  function renderView() {
    document.getElementById('stations').style.display = view === 'stations' ? 'block' : 'none';
    document.querySelector('footer').style.display = view === 'about' ? 'block' : 'none';
    document.querySelector('header a').textContent = view === 'stations' ? chrome.i18n.getMessage('live_stream') : chrome.i18n.getMessage('back');
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    reset();
    switch (request.status) {
      case 'buffering':
        stations[localStorage.getItem('station')].isBuffering = true;
        stations[localStorage.getItem('station')].isPlaying = false;
        break;
      case 'playing':
        stations[localStorage.getItem('station')].isBuffering = false;
        stations[localStorage.getItem('station')].isPlaying = true;
        break;
    }
    renderStations();
  });

  document.querySelectorAll('[data-href]').forEach(link => {
    link.addEventListener('click', () => {
      window.open(link.getAttribute('data-href'));
    });
  });

  document.querySelectorAll('[i18n]').forEach(element => {
    element.textContent = chrome.i18n.getMessage(element.getAttribute('i18n'));
  });

  document.querySelector('header a').addEventListener('click', toggleView);

  init();
});
