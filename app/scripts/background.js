const siteCache = [];

const prefixes = ["www.", "m.", "mobile.", "apps.", "free."];

function getMinimalDomain(domain) {
  let minimalDomain = domain;
  prefixes.forEach((prefix) => {
    if(minimalDomain.indexOf(prefix) !== -1){
      minimalDomain = minimalDomain.split(prefix)[1];
    }
  });
  return minimalDomain;
}

function getIssuesApiPage(domain){
  let minimalDomain = getMinimalDomain(domain);
  let query = `is%3Aissue%20is%3Aopen%20in%3Atitle%20${minimalDomain}`;
  prefixes.forEach((prefix) => {
    query=`${query}%20OR%20in%3Atitle%20${prefix}${minimalDomain}`
  });
  return `https://api.github.com/search/issues?page=1&per_page=50&stage=all&sort=created&q=${query}%20state%3Aopen%20repo%3Awebcompat%2Fweb-bugs&order=desc`;
}

function getIssuesPage(domain) {
  let minimalDomain = getMinimalDomain(domain);
  let query = `is%3Aissue+is%3Aopen+in%3Atitle+${domain}`;
  prefixes.forEach((prefix) => {
    query=`${query}+OR+in%3Atitle+${prefix}${minimalDomain}`
  });
  return `https://github.com/webcompat/web-bugs/issues?q=${query}`;
}

async function getIssuesForSite(site){
  if(!siteCache[site]) {
    const issuesPage = getIssuesApiPage(site);
    const response = await fetch(issuesPage);
    const issuesAsJson = await response.json();
    const siteData = {
      site,
      issuesCount: issuesAsJson.total_count,
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
