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

async function getIssues(domain, state) {
  let minimalDomain = await getMinimalDomain(domain);
  let query = `is%3Aissue%20is%3Aopen%20in%3Atitle%20${minimalDomain}`;
  prefixes.forEach((prefix) => {
    query = `${query}%20OR%20in%3Atitle%20${prefix}${minimalDomain}`
  });
  const issuesPage = `https://api.github.com/search/issues?page=1&per_page=50&stage=all&sort=created&q=${query}%20is%3A${state}%20repo%3Awebcompat%2Fweb-bugs&order=desc`;
  const response = await (await fetch(issuesPage)).json();
  const issuesCount = response.total_count;
  return {
    issuesCount,
    issuesPage,
  };
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
    const issues = await getIssues(site, 'open');
    const closedIssuesCount = await getIssues(site, 'closed');
    const siteData = {
      site,
      openedIssuesCount: issues.issuesCount,
      closedIssuesCount: closedIssuesCount.issuesCount,
      page: issues.issuesPage
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
  const issuesCount = data.openedIssuesCount;
  if (issuesCount > 0) {
    let issueCount = "infinity";
    if (issuesCount <= 9) {
      issueCount = issuesCount;
    }
    icon = `images/count/${issueCount}.png`;
  }
  chrome.browserAction.setTitle({
    tabId: tabId,
    title: `Incompat - There are ${data.openedIssuesCount} opened issues and ${data.closedIssuesCount} closed issues on ${minimalDomain}. Click to see more.`
  });
  chrome.browserAction.setIcon({
    tabId: tabId,
    path: icon
  });
  chrome.browserAction.setBadgeText({
    tabId: tabId,
    text: data.closedIssuesCount.toString()
  });
  chrome.browserAction.enable(tabId);
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

chrome.browserAction.onClicked.addListener(async (tab) => {
  let currentHost = await getDomainForUrl(tab.url);
  const issuesPage = await getIssuesPage(currentHost);
  chrome.tabs.create({
    url: issuesPage
  });
});
