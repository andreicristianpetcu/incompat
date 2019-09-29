browser.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion)
})

browser.tabs.onUpdated.addListener(async (tabId) => {
  browser.pageAction.show(tabId)
})

function getIssuesPage(domain) {
  return `https://github.com/webcompat/web-bugs/issues?q=is%3Aissue+in%3Atitle+${domain}+is%3Aopen`;
}

async function getIssuesForSite(site){
  const issuesPage = getIssuesPage(site);
  const response = await fetch(issuesPage);
  const text = await response.text();
  var el = document.createElement('html');
  el.innerHTML = text;
  const issues = el.querySelectorAll("a[data-hovercard-type=\"issue\"]");
  return {
    site,
    issuesCount: issues.length,
    page: issuesPage
  };
}

async function onComplete(params){
  const currentHost = new URL(params.url).host
  const data = await getIssuesForSite(currentHost);
  if(data.issuesCount > 0) {
    browser.pageAction.setIcon({
      tabId: params.tabId, path: `images/count/${data.issuesCount}.png`
    });
    browser.pageAction.show(params.tabId);
  } else {
    browser.pageAction.hide(params.tabId);
  }
}

browser.webNavigation.onCompleted.addListener(onComplete,
  { url: [{ schemes: ["http", "https", "ftp", "ftps"] }] }
);

browser.pageAction.onClicked.addListener((tab) => {
  const issuesPage = getIssuesPage(new URL(tab.url).host);
  var creating = browser.tabs.create({
    url: issuesPage
  });
});