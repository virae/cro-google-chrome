const assets_path = '/assets/img/';
let currentStation = null;
let playerWindowId = null;

const createAudioWindow = async (streamURL) => {
  const url = chrome.runtime.getURL(`audio.html?stream=${streamURL}`);
  try {
    const { id } = await chrome.windows.create({
      type: 'popup',
      focused: false,
      top: 1,
      left: 1,
      height: 1,
      width: 1,
      url,
    });
    await chrome.windows.update(id, { focused: false });
    return id;
  } catch (e) {
    console.error('Error creating audio window:', e);
  }
};

const removeAudioWindow = async () => {
  try {
    if (playerWindowId) {
      await chrome.windows.remove(playerWindowId);
    }
  } catch (e) {
    console.error('Error removing audio window:', e);
  }
};

const handlePlayRequest = async (station, stream, index) => {
  await removeAudioWindow();
  playerWindowId = await createAudioWindow(stream);
  chrome.runtime.sendMessage({ status: 'playing' });
  currentStation = index;
  chrome.action.setIcon({ path: `${assets_path}icon-state-playing.png` });
};

const handleStopRequest = () => {
  removeAudioWindow();
  playerWindowId = null;
  currentStation = null;
  chrome.action.setIcon({ path: `${assets_path}icon-default.png` });
};

chrome.runtime.onMessage.addListener((request) => {
  const { action, station, stream, index } = request;
  if (action === 'play' && station) {
    handlePlayRequest(station, stream, index);
  } else if (action === 'stop') {
    handleStopRequest();
  }
});

// Remove audio window when all other windows are closed
chrome.windows.onRemoved.addListener(() => {
  chrome.windows.getAll((windows) => {
    if (
      windows.length === 1 &&
      windows[0].type === 'popup' &&
      windows[0].id === playerWindowId
    ) {
      try {
        chrome.windows.remove(playerWindowId);
      } catch (e) {
        console.error('Error removing audio window:', e);
      }
    }
  });
});
