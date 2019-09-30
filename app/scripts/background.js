const siteCache = [];

function getIssuesPage(domain) {
  return `https://github.com/webcompat/web-bugs/issues?q=is%3Aissue+in%3Atitle+${domain}+is%3Aopen`;
}

async function getIssuesForSite(site){
  if(!siteCache[site]) {
    const issuesPage = getIssuesPage(site);
    const response = await fetch(issuesPage);
    const text = await response.text();
    var el = document.createElement('html');
    el.innerHTML = text;
    const issues = el.querySelectorAll("a[data-hovercard-type=\"issue\"]");
    siteCache[site] = {
      site,
      issuesCount: issues.length,
      page: issuesPage
    };
  }
  return siteCache[site];
}

async function refreshDataForDomain(domain, tabId){
  const data = await getIssuesForSite(domain);
  if(data.issuesCount > 0) {
    let issueCount = "infinity";
    if(data.issuesCount <= 9){
      issueCount = data.issuesCount;
    }
    browser.pageAction.setIcon({
      tabId: tabId,
      path: `images/count/${issueCount}.png`
    });
    browser.pageAction.show(tabId);
  }
}

async function onComplete(params){
  const currentHost = new URL(params.url).host
  refreshDataForDomain(currentHost, params.tabId);
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
