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

// Remove 'start='
function makeURL(statusText){
  var URL = statusText.replace(/start=(\d{1,5})&/i, ''); 
  return URL;
}

// 검색어
function searchKeyword(statusText){
  var keyword = decodeURI(statusText.split('q=')[1].split('&')[0]).replace('+', ' ');
  return keyword;
}

// 크롤링 한 데이터를 담는 배열
const data = [];

// 크롤링 함수
async function crawl(url) {
  // 수집중인 URL
  const decodedUrl = decodeURI(url);
  console.log(`크롤링 ${decodedUrl} ...`);
  // URL에서 데이터를 가져옴
  const response = await fetch(url  , {
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

  // 검색 결과 수
  const num = Number(htmlDOM
    .getElementById('gs_ab_md')
    .textContent
    .split('(')[0]
    .replace(/[^0-9]/g, ''));
  console.log(num);

  for(let i=0; i<=num; i+=10){
    const responseSearch = await fetch(url + '&start=' + i, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const htmlString = await responseSearch.text();
    const parser = new DOMParser();
    const htmlDOM = parser.parseFromString(htmlString, 'text/html');
    // 검색 결과 가공
    const contents = htmlDOM.getElementById('gs_res_ccl_mid');
    const oneData = contents.querySelectorAll('.gs_r');

    oneData.forEach((elementData)=>{
      console.log(elementData);
      const element = elementData.querySelector('div.gs_ri');
      let title = element.querySelector('h3.gs_rt > a');
      let url = element.querySelector('h3.gs_rt > a');
      let citation = element.querySelector('div.gs_flb > [href*="/scholar?cites="]');
      let author = element.querySelector('div.gs_a');
      let publish = element.querySelector('div.gs_a');
      let journal = elementData.querySelector('div.gs_ggs > div.gs_ggsd > div.gs_or_ggsm > a');

      if(title != null) {
        title = title.textContent;
        url = url.href;
      } else {
        title = element.querySelector('h3.gs_rt').textContent;
        url = '';
      }

      if(citation != null) citation = citation.textContent.replace(/[^0-9]/g, '');
      else citation = 0;
      
      if(journal != null) journal = journal.textContent.replace('[PDF] ', '');
      else journal = '';

      if(author != null) author = author.textContent.split(' - ')[0].split(',')[0];
      else author = '';


      if(publish != null) {
        if(publish.textContent.match(/\d{4} -/g)) {
          publish = publish.textContent.match(/\d{4} -/g)[0].replace(' -', '');
        }
        else if(publish.textContent.match(/\d{4}/g)) {
          publish = publish.textContent.match(/\d{4}/g)[0];
        } 
        else publish = '';
      } 
      else publish = '';

      // 추출한 데이터를 배열에 저장
      data.push({
        title,
        author,
        journal,
        publish,
        citation,
        url
      });
      //console.log(element);
    })
  }

}

// result div에 URL 값을 뿌려주는 함수
function renderUrl(statusText) {
  //document.getElementById('result').textContent = statusText;
  var isGoogleSchoalr = statusText.includes('https://scholar.google');

  if(isGoogleSchoalr) {
    document.getElementById('result').textContent = 'Crawling.... Just a moment.'
  } else{
    document.getElementById('result').textContent = 'This page is not Google Scholar.';
  }
}

// CSV로 배열 추출
function makeCSV(TITLE){
  const jsonData = JSON.stringify(data);
  let arrData = JSON.parse(jsonData);

  let CSV = '';
  //CSV += TITLE + '\r\n\n';

  let row = "";
  for (let index in arrData[0]) {
      row += index + ',';
  }
  row = row.slice(0, -1);
  CSV += row + '\r\n';

  for (let i = 0; i < arrData.length; i++) {
    let row = "";
    for (let index in arrData[i]) {
        row += '"' + arrData[i][index] + '",';
    }

    row.slice(0, row.length - 1);
    CSV += row + '\r\n';
  }

  let uri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURI(CSV);
  let link = document.createElement("a");    
    link.href = uri;
    link.style = "visibility:hidden";
    link.download = TITLE + ".csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          document.getElementById('result').textContent = 'Complete.'
          makeCSV(searchKeyword(url));
        })
        .catch(err => console.error(err));
    });
  });  
});