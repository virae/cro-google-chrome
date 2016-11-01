
	var scope;

	angular.module('app', []).controller('streamer', function ($scope, $filter, $http) {

		var API_URL = "http://data.rozhlas.cz/api/v2/";

		// Views
		$scope.view = 'stations'; // [stations, about]

		$scope.init = function() {

			// Get stations
			$http.get(API_URL + "meta/radioconfig.json", {cache: true}).success(function(response){
				var data = response.data;

				// Filter list of stations
				$scope.stations = _.filter(data.station, function(station){
					return station["@attributes"].type == "celoplošná";
				});

				// Get station schedule
				for (i = 0; i < $scope.stations.length; i++) {
					$scope.getCurrentShow($scope.stations[i]);
				}

				// Set current station as playing
				if (currentStation = localStorage.getItem('station')) {
					$scope.stations[currentStation].isPlaying = true;
				}

			}, function(error) {
				// Error

			});
		}

		// Reset
		$scope.reset = function(station, index) {
			for (i = 0; i < $scope.stations.length; i++) {
				$scope.stations[i].isPlaying = false;
				$scope.stations[i].isBuffering = false;
			}
		}

		// Toggle playback
		$scope.play = function(station, index) {

			if (station.isPlaying || station.isBuffering) {

				chrome.runtime.sendMessage({ action: "stop" });
				localStorage.removeItem('station');
				$scope.reset();

			} else {

				// Get audio stream
				var streamInfo = _.find(station.audio.directstream.item, function(item) {
					return item["@attributes"].type == "mp3" && item["@attributes"].bitrate == 128;
				});
				var stream = streamInfo["@attributes"].url;

				chrome.runtime.sendMessage({ action: "play", station: station, index: index, stream: stream });
				localStorage.setItem('station', index);
				$scope.reset();
			}
		}

		// Get station schedule from API
		$scope.getCurrentShow = function(station) {

			// Build API url
			var parts = [
				"schedule/day",
				$filter('date')(new Date(), "yyyy/MM/dd"),
				station["@attributes"].kod_webu
			];

			var url = API_URL + parts.join("/") + ".json";

			// Retrieve data
			$http.get(url, {cache: true}).success(function(response){
				var data = response.data;
				for (i = 0; i < data.length; i++) {
					var now = new Date();
					var since = new Date(data[i].since);
					var till = new Date(data[i].till);
					if (now >= since && now < till) {
						station.nowplaying = data[i].title;
						break;
					}
				}
			})
		}

		$scope.toggleView = function() {
			$scope.view = $scope.view == 'stations' ? 'about' : 'stations';
		}

		$scope.init();

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

		[].forEach.call(document.querySelectorAll('[i18n]'), function(element) {

			element.innerHTML = chrome.i18n.getMessage(element.getAttribute('i18n'));

		});

	})();
