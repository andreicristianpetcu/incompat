browser.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion)
})

browser.tabs.onUpdated.addListener(async (tabId) => {
  browser.pageAction.show(tabId)
})

async function getIssuesForSite(site){
  const issuesPage = `https://github.com/webcompat/web-bugs/issues?q=is%3Aissue+in%3Atitle+${site}+is%3Aopen`;
  const response = await fetch(issuesPage);
  const text = await response.text();
  var el = document.createElement('html');
  el.innerHTML = text;
  const issues = el.querySelectorAll("a[data-hovercard-type=\"issue\"]");
  return {
    site,
    issuesCount: issues.length,
    page: `https://github.com/webcompat/web-bugs/issues?q=is%3Aissue+in%3Atitle+${site}+is%3Aopen`
  };
}

async function init(){
  const data = await getIssuesForSite('www.decathlon.ro');
  console.log(data);
}
init();