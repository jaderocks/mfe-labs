
addEventListener('load', load); // https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event

function load() {
  const contentArea = document.getElementById('content');

  // console.debug('contentArea', contentArea);

  contentArea.innerHTML = chrome.i18n.getMessage('popup_test');
  
}
