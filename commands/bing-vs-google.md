---
description: How a query ranks on Bing, and where that differs from Google
---

Show me who ranks on Bing for a query.

Ask me for the query and the market if I have not given them. Market means a country and a language, and it changes the page.

Then:

1. Call `hasdata_bing_serp_getSearchResults` with `q`, `mkt`, `cc` and `setLang` for that market.
2. List the organic results in order as position, title and domain. Report how many came back rather than assuming ten, because Bing varies the count.
3. If the payload carries `ads`, list the advertisers by `displayedLink`, not by `link`, since the link is a Bing click tracker.
4. If it carries `copilotSearch`, quote the answer out of `textBlocks` and list `references`. Say the answer cites nothing when `references` is empty, which is common.
5. Do not report a knowledge panel, videos, images or related searches. This payload has none of them, so describing them means inventing them.
6. Page only if I ask, with `first: 11` for the second page, and check the links actually changed before reporting them as new. Bing ignores some offsets and returns the first page again.

If I also have the Google MCP server connected, run the same query there and put the two lists side by side, marking the domains that appear on one engine and not the other. Otherwise say that the comparison needs it, and stop rather than guessing what Google would show.
