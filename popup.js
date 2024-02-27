// 현재 윈도우 화면에서 URL 정보를 얻어오는 함수
function getTabUrl(callback) {
    var queryInfo = {
      active : true,
      currentWindow : true
    };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    callback(url);
  });
}
  
// result div에 URL 값을 뿌려주는 함수
function renderUrl(statusText) {
  //document.getElementById('result').textContent = statusText;
  var defaultURL = statusText.split('?')[0];
  var isGoogleSchoalr = defaultURL.includes('https://scholar.google');
  var hl = statusText.split('hl=')[1].split('&')[0];
  var as_sdt = statusText.split('as_sdt=')[1].split('&')[0];
  var query = statusText.split('q=')[1].split('&')[0];
  var URL = defaultURL + '?hl=' + hl + '&as_sdt=' + as_sdt + '&q=' + query;
  
  document.getElementById('result').textContent = URL;
}

// 클릭 이벤트가 발생했을 경우 getTabUrl와 renderUrl 함수를 사용해
// 확장 프로그램 상에 URL Road
document.addEventListener('DOMContentLoaded', function() {

  var link = document.getElementById('getUrl');

  link.addEventListener('click', function() {
    getTabUrl(function(url) {
      renderUrl(url);
    });
  });
  
});