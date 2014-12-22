
	var scope;
	var station = localStorage.getItem('station') || null;

	angular.module('app', []).controller('streamer', function ($scope) {

		// Views
		$scope.view = 'stations'; // [stations, about]

		// Stations
		$scope.stations = [
			{
				"id": "radiozurnal",
				"name": "Radiožurnál",
				"ogg" : "http://amp.cesnet.cz:8000/cro1.ogg",
				"mp3" : "http://icecast7.play.cz/cro1-128.mp3",
				"color": "#ED2E38"
			},
			{
				"id": "dvojka",
				"name": "Dvojka",
				"ogg" : "http://amp.cesnet.cz:8000/cro2.ogg",
				"mp3" : "http://icecast7.play.cz/cro2-128.mp3",
				"color": "#85248F"
			},
			{
				"id": "vltava",
				"name": "Vltava",
				"ogg" : "http://amp.cesnet.cz:8000/cro3.ogg",
				"mp3" : "http://icecast5.play.cz/cro3-128.mp3",
				"color": "#00B8E0"
			},
			{
				"id": "plus",
				"name": "Plus",
				"ogg" : "",
				"mp3" : "http://icecast1.play.cz/croplus128.mp3",
				"color": "#DE7008"
			},
			{
				"id": "wave",
				"name": "Radio Wave",
				"ogg" : "http://amp.cesnet.cz:8000/cro-radio-wave.ogg",
				"mp3" : "http://icecast5.play.cz/crowave-128.mp3",
				"color": "#CDA200"
			},
			{
				"id": "ddur",
				"name": "D-dur",
				"ogg" : "http://amp.cesnet.cz:8000/cro-d-dur.ogg",
				"mp3" : "http://icecast5.play.cz/croddur-128.mp3",
				"color": "#AB035C"
			},
			{
				"id": "jazz",
				"name": "Jazz",
				"ogg" : "http://stream3.rozhlas.cz:8000/jazz_mid.ogg",
				"mp3" : "http://icecast1.play.cz/crojazz128.mp3",
				"color": "#00809E"
			},
			{
				"id": "junior",
				"name": "Rádio Junior",
				"ogg" : "http://amp.cesnet.cz:8000/cro-radio-junior.ogg",
				"mp3" : "http://icecast5.play.cz/crojuniormaxi128.mp3",
				"color": "#04123A"
			},
			{
				"id": "region",
				"name": "Regionální stanice",
				"ogg" : "",
				"mp3" : "",
				"color": "#00AB96"
			}
		];

		// Reset
		$scope.reset = function(station, index) {
			angular.forEach($scope.stations, function(obj){
				obj.isPlaying = false;
				obj.isBuffering = false;
			})
		}

		// Toggle playback
		$scope.play = function(station, index) {

			if (station.isPlaying || station.isBuffering) {

				chrome.runtime.sendMessage({ action: "stop" });
				localStorage.removeItem('station');
				$scope.reset();

			} else {

				chrome.runtime.sendMessage({ action: "play", station: station, index: index });
				localStorage.setItem('station', index);
				$scope.reset();

			}
		}

		$scope.toggleView = function() {
			$scope.view = $scope.view == 'stations' ? 'about' : 'stations';
		}

		if (station) {
			$scope.stations[station].isPlaying = true;
		}

		scope = $scope;

	});

	chrome.extension.onMessage.addListener(
		function(request, sender, sendResponse) {

			scope.reset();

			switch (request.status) {
				case 'buffering':
					scope.stations[localStorage.getItem('station')].isBuffering = true;
					scope.stations[localStorage.getItem('station')].isPlaying = false;
				break;
				case 'playing':
					scope.stations[localStorage.getItem('station')].isBuffering = false;
					scope.stations[localStorage.getItem('station')].isPlaying = true;
				break;
			}
			scope.$apply();
		}
	);

	(function() {

		[].forEach.call(document.querySelectorAll('[data-href]'), function(link) {

			link.addEventListener('click',function(){
				window.open(link.getAttribute('data-href'));
			});

		});

	})();
