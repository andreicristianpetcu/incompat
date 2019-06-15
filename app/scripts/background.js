browser.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion)
})

browser.tabs.onUpdated.addListener(async (tabId) => {
  browser.pageAction.show(tabId)
})

console.log(`'Allo 'Allo! Event Page for Page Action`)

async function getIssues(){
  const response = await fetch('https://api.github.com/repos/webcompat/web-bugs/issues?utf8=%E2%9C%93&q=is%3Aissue+%27youtube.com%27+in%3Atitle+is%3Aopen+')
  let data = await response.json();
  console.log(data);
}
getIssues();