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

function makeURL(statusText){
  var URL = statusText.replace(/start=(\d{1,5})&/i, ''); // Remove 'start='
  return URL;
}

// result div에 URL 값을 뿌려주는 함수
function renderUrl(statusText) {
  //document.getElementById('result').textContent = statusText;
  var isGoogleSchoalr = statusText.includes('https://scholar.google');

  if(isGoogleSchoalr) {
    document.getElementById('result').textContent = makeURL(statusText);
  } else{
    document.getElementById('result').textContent = 'This page is not Google Scholar.';
  }
}

const data = [];

async function crawl(url) {
  // 수집중인 URL
  const decodedUrl = decodeURI(url);
  console.log(`크롤링 ${decodedUrl} ...`);
  // URL에서 데이터를 가져옴
  const response = await fetch(url, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
  });
  // 응답 데이터를 문자열로 변환
  const htmlString = await response.text();
  // HTML 문자열을 파싱하여 DOM 객체 생성
  const parser = new DOMParser();
  const htmlDOM = parser.parseFromString(htmlString, 'text/html');
  const contents = htmlDOM.getElementById('gs_res_ccl_mid');
  const oneData = contents.querySelectorAll('.gs_ri');

  oneData.forEach((element)=>{
    //console.log(element);
    const title = element.querySelector('h3.gs_rt > a').textContent;
    const url = element.querySelector('h3.gs_rt > a').href;
    let cites = element.querySelector('div.gs_flb').querySelector('[href*="/scholar?cites="]');
    if(cites != null){
      cites = cites.textContent.replace(/[^0-9]/g, '');
    } else{
      cites = 0;
    }

    //cites = cites.replace(/[^0-9]/g, '');
    //if(cites == null) cites = 0;
    console.log(cites);
    // 추출한 데이터를 배열에 저장
    data.push({
      title,
      url,
      cites
    });
    //console.log(element);
  })
}

// 클릭 이벤트가 발생했을 경우 getTabUrl와 renderUrl 함수를 사용해
// 확장 프로그램 상에 URL Road
document.addEventListener('DOMContentLoaded', function() {
  var link = document.getElementById('getUrl');
  link.addEventListener('click', function() {
    getTabUrl(function(url) {
      renderUrl(url);
      // 실행
      crawl(makeURL(url))
        .then(() => {
          console.log('크롤링 완료');
          console.log(JSON.stringify(data, null, 2));
        })
        .catch(err => console.error(err));
    });
  });  
});