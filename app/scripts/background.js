const siteCache = [];

function getIssuesPage(domain) {
  const prefixes = ["www.", "m.", "mobile.", "apps.", "free."];
  let minimalDomain = domain;
  prefixes.forEach((prefix) => {
    if(minimalDomain.indexOf(prefix) !== -1){
      minimalDomain = minimalDomain.split(prefix)[1];
    }
  });
  let query = `is%3Aissue+is%3Aopen+in%3Atitle+${domain}`;
  prefixes.forEach((prefix) => {
    query=`${query}+OR+in%3Atitle+${prefix}${minimalDomain}`
  });
  return `https://github.com/webcompat/web-bugs/issues?q=${query}`;
}

async function getIssuesForSite(site){
  if(!siteCache[site]) {
    const issuesPage = getIssuesPage(site);
    const response = await fetch(issuesPage);
    const text = await response.text();
    var el = document.createElement('html');
    el.innerHTML = text;
    const issues = el.querySelectorAll("a[data-hovercard-type=\"issue\"]");
    const siteData = {
      site,
      issuesCount: issues.length,
      page: issuesPage
    };
    siteCache[site] = siteData;
    return siteData;
  }
  return siteCache[site];
}

async function refreshDataForDomain(domain, tabId){
  const data = await getIssuesForSite(domain);
  let icon = "images/icon-16.png";
  if(data.issuesCount > 0) {
    let issueCount = "infinity";
    if(data.issuesCount <= 9){
      issueCount = data.issuesCount;
    }
    icon = `images/count/${issueCount}.png`;
  }
  chrome.pageAction.setIcon({
    tabId: tabId,
    path: icon
  });
  chrome.pageAction.show(tabId);
}

async function onComplete(params){
  if (params.frameId !== 0) {
    return;
  }
  const currentHost = new URL(params.url).host
  refreshDataForDomain(currentHost, params.tabId);
}

chrome.webNavigation.onCompleted.addListener(onComplete,
  { url: [{ schemes: ["http", "https", "ftp", "ftps"] }] }
);

chrome.pageAction.onClicked.addListener((tab) => {
  const issuesPage = getIssuesPage(new URL(tab.url).host);
  var creating = chrome.tabs.create({
    url: issuesPage
  });
});
