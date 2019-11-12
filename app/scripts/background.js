const siteCache = [];

const prefixes = ["www.", "m.", "mobile.", "apps.", "free."];

async function getMinimalDomain(domain) {
  let minimalDomain = domain;
  prefixes.forEach((prefix) => {
    if (minimalDomain.startsWith(prefix)) {
      minimalDomain = minimalDomain.split(prefix)[1];
    }
  });
  return minimalDomain;
}

async function getIssuesApiPage(domain) {
  let minimalDomain = await getMinimalDomain(domain);
  let query = `is%3Aissue%20is%3Aopen%20in%3Atitle%20${minimalDomain}`;
  prefixes.forEach((prefix) => {
    query = `${query}%20OR%20in%3Atitle%20${prefix}${minimalDomain}`
  });
  return `https://api.github.com/search/issues?page=1&per_page=50&stage=all&sort=created&q=${query}%20state%3Aopen%20repo%3Awebcompat%2Fweb-bugs&order=desc`;
}

async function getIssuesPage(domain) {
  let minimalDomain = await getMinimalDomain(domain);
  let query = `is%3Aissue+is%3Aopen+in%3Atitle+${minimalDomain}`;
  prefixes.forEach((prefix) => {
    query = `${query}+OR+in%3Atitle+${prefix}${minimalDomain}`
  });
  return `https://github.com/webcompat/web-bugs/issues?q=${query}`;
}

async function getIssuesForSite(site) {
  if (!siteCache[site]) {
    const issuesPage = await getIssuesApiPage(site);
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

async function refreshDataForDomain(domain, tabId) {
  let minimalDomain = await getMinimalDomain(domain);
  const data = await getIssuesForSite(domain);
  let icon = "images/icon-16.png";
  if (data.issuesCount > 0) {
    let issueCount = "infinity";
    if (data.issuesCount <= 9) {
      issueCount = data.issuesCount;
    }
    icon = `images/count/${issueCount}.png`;
    chrome.pageAction.setTitle({
      tabId: tabId,
      title: `Incompat - There are ${data.issuesCount} opened issues on ${minimalDomain}`
    });
  } else {
    chrome.pageAction.setTitle({
      tabId: tabId,
      title: `Incompat - There no ${data.issuesCount} opened issues on ${minimalDomain}. Click to see closed issues!`
    });
  }
  chrome.pageAction.setIcon({
    tabId: tabId,
    path: icon
  });
  chrome.pageAction.show(tabId);
}

async function getDomainForUrl(url) {
  let domain = new URL(url).host
  try {
    if (url.indexOf("https://github.com/webcompat/web-bugs/issues/") > -1) {
      const issueId = url.split("https://github.com/webcompat/web-bugs/issues/")[1];
      const issueResponse = await fetch(`https://github.com/webcompat/web-bugs/issues/${issueId}`);
      const html = await issueResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const title = doc.querySelector(".gh-header-title");
      domain = title.textContent.trim().split(" - ")[0]
    }
  } finally {
    return domain;
  }
}

async function onComplete(params) {
  if (params.frameId !== 0) {
    return;
  }
  let currentHost = await getDomainForUrl(params.url);
  refreshDataForDomain(currentHost, params.tabId);
}

chrome.webNavigation.onCompleted.addListener(onComplete,
  { url: [{ schemes: ["http", "https", "ftp", "ftps"] }] }
);

chrome.pageAction.onClicked.addListener(async (tab) => {
  let currentHost = await getDomainForUrl(tab.url);
  const issuesPage = await getIssuesPage(currentHost);
  chrome.tabs.create({
    url: issuesPage
  });
});
