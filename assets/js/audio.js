if (location.search !== '' && new URL(location.href).searchParams.get('stream')) {
  audio = document.getElementsByTagName("audio")[0];
  audio.src = new URL(location.href).searchParams.get('stream');
  audio.play()
}
