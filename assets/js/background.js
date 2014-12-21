
	var currentStation = null;
	var audio;

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {

			var action = request.action;
			var station = request.station;
			var audio;

			if (action == 'play' && station) {

				audio = document.getElementsByTagName("audio")[0];

				if (!audio.paused) {
					audio.pause();
					audio.currentTime = 0;
				}

				if (station.ogg) {
					audio.src = station.ogg;
				}
				else if (station.mp3) {
					audio.src = station.mp3;
				}

				// Play!
				audio.play();

				chrome.extension.sendMessage({status: "buffering"});

				audio.onplaying = function() {
					chrome.extension.sendMessage({status: "playing"});
				}
				audio.waiting = function() {
					chrome.extension.sendMessage({status: "buffering"});
				}

				// Set currently playing station
				currentStation = request.index;

				// Set playing icon
				chrome.browserAction.setIcon({path: "icon-state-playing.png"});
			}

			if (action == 'stop') {

				audio = document.getElementsByTagName("audio")[0];

				audio.pause();
				audio.currentTime = 0;
				audio.src = '';

				currentStation = null;

				// Set default icon
				chrome.browserAction.setIcon({path: "icon-default.png"})
			}
		}
	);
