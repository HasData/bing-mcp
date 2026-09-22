# Bing MCP Server

<!-- mcp-name: com.hasdata/bing -->

A hosted Model Context Protocol (MCP) server that gives Claude, Cursor, Windsurf and any other MCP client one read-only Bing tool. Run a Bing search from a chosen country, market, language and device, and get the organic results, the ad block and the Copilot answer as structured JSON, with no Azure subscription and nothing to host.

It reads the Bing results page a signed-out visitor sees.

**1,000 free credits every month, no card required**, which is 100 Bing calls at the 10-credit rate.

```
https://mcp.hasdata.com/api/mcp?apis=bing
```

[![Glama score](https://glama.ai/mcp/servers/HasData/bing-mcp/badges/score.svg)](https://glama.ai/mcp/servers/HasData/bing-mcp)
[![tool contract](https://github.com/HasData/bing-mcp/actions/workflows/contract.yml/badge.svg)](https://github.com/HasData/bing-mcp/actions/workflows/contract.yml)
[![MCP](https://img.shields.io/badge/MCP-remote%20%7C%20streamable%20HTTP-6366f1?style=flat-square)](https://mcp.hasdata.com/api/mcp?apis=bing)
[![Tools](https://img.shields.io/badge/tools-1-10b981?style=flat-square)](#tools)
[![npm](https://img.shields.io/npm/v/@hasdata/bing-mcp?style=flat-square&logo=npm&label=npm&color=cb3837)](https://www.npmjs.com/package/@hasdata/bing-mcp)
[![PyPI](https://img.shields.io/pypi/v/hasdata-bing-mcp?style=flat-square&logo=pypi&logoColor=white&label=PyPI&color=3775a9)](https://pypi.org/project/hasdata-bing-mcp/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

## Contents

- [What you need](#what-you-need)
- [Quick start](#quick-start)
- [Example prompts](#example-prompts)
- [Tools](#tools)
- [Errors and failure paths](#errors-and-failure-paths)
- [Pricing, free tier and limits](#pricing-free-tier-and-limits)
- [How it compares](#how-it-compares)
- [FAQ](#faq)
- [HasData links](#hasdata-links)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## What you need

An MCP client and a HasData API key from the [dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp), free to create with no card, and the free tier covers about 100 calls a month at the 10-credit rate. This is a remote server, so the simplest path is a URL and an `x-api-key` header, with no container to run. A client that only speaks stdio reaches it through a thin launcher, published as `@hasdata/bing-mcp` on npm and `hasdata-bing-mcp` on PyPI, shown below.

## Quick start

The server URL is the same for every client. We run it hands-on in Claude Code and Claude Desktop. The other blocks follow each client's own documented format for a remote server.

| Field | Value |
| :--- | :--- |
| URL | `https://mcp.hasdata.com/api/mcp?apis=bing` |
| Transport | HTTP, streamable |
| Auth header | `x-api-key: HASDATA_API_KEY` |

Clients with OAuth support can add the same URL as a connector and sign in without putting a key in a config file.

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add --transport http bing "https://mcp.hasdata.com/api/mcp?apis=bing" \
  --header "x-api-key: HASDATA_API_KEY"
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Settings, then Connectors, then Add custom connector, then paste `https://mcp.hasdata.com/api/mcp?apis=bing` and sign in.

For the config-file route, Claude Desktop loads only local (stdio) servers, so it reaches a remote server through a stdio launcher. The `@hasdata/bing-mcp` package is that launcher, and it reads the key from the environment. Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bing": {
      "command": "npx",
      "args": ["-y", "@hasdata/bing-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

For Python instead of Node, swap the launcher for the PyPI package, which `uvx` runs without a manual install:

```json
{
  "mcpServers": {
    "bing": {
      "command": "uvx",
      "args": ["hasdata-bing-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

`~/.cursor/mcp.json` for every project, or `.cursor/mcp.json` for one:

```json
{
  "mcpServers": {
    "bing": {
      "url": "https://mcp.hasdata.com/api/mcp?apis=bing",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

`~/.codeium/windsurf/mcp_config.json`. Windsurf calls the field `serverUrl`, not `url`:

```json
{
  "mcpServers": {
    "bing": {
      "serverUrl": "https://mcp.hasdata.com/api/mcp?apis=bing",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

`.vscode/mcp.json` in the workspace:

```json
{
  "servers": {
    "bing": {
      "type": "http",
      "url": "https://mcp.hasdata.com/api/mcp?apis=bing",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

## Example prompts

- Search Bing for python web scraping tutorials and list the top ten sources.
- Who is advertising against the query "best crm software" on Bing right now?
- What does Bing Copilot answer for this query, and which pages does it cite?
- Run this query from Germany in German and compare the results with the US ones.
- Show me pages Bing indexed for this query in the past week.
- Search this query as a mobile user and tell me whether the ranking differs from desktop.

One call answers each of these. Paging to the second and third page of results takes one more call each.

## Tools

| Tool | What it returns |
| --- | --- |
| `hasdata_bing_serp_getSearchResults` | Organic results (title, url, snippet, displayed url, position), related searches, answer boxes/knowledge panels, and pagination metadata. 10 credits a call |

One tool, 10 credits per successful call.

### Get Bing search results

[`hasdata_bing_serp_getSearchResults`](https://docs.hasdata.com/apis/bing/serp?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp)

One Bing results page.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `q` | string | yes | The search term |
| `location` | string | | Free-text origin, such as `Austin, Texas`. Resolved to coordinates |
| `lat` / `lon` | string | | GPS origin. Takes precedence over `location` |
| `mkt` | string | | Market, one of 38, such as `en-gb` or `de-de` |
| `cc` | string | | Country, one of 36, such as `gb` or `de` |
| `setLang` | string | | Interface and preferred result language, one of 39 |
| `safeSearch` | string | | `off`, `moderate` or `strict` |
| `deviceType` | string | | `desktop`, `mobile` or `tablet` |
| `filters` | string | | A Bing filter string, such as `ex1:"ez2"` for the past week |
| `first` | number | | Result offset, `1` for the first page, `11` for the second |

Returns `organicResults` always, plus `ads` and `copilotSearch` when the page carries them.

An organic result has `position`, `title`, `link`, `displayedLink`, `source` and `snippet`.

```json
{
  "position": 1,
  "title": "10 Best CRM Software Of 2026 – Forbes Advisor",
  "link": "https://www.forbes.com/advisor/business/software/best-crm-software/",
  "displayedLink": "https://www.forbes.com › advisor › business › software › best-crm-software",
  "source": "Forbes",
  "snippet": "Compare top CRM options to find the best fit for your needs and budget, and explore features, pricing and support using the links below."
}
```

`ads` appears on commercial queries and carries `position`, `blockPosition`, `title`, `link`, `source`, `displayedLink`, `description` and `sitelinks`. Six ads came back for `best crm software` and none for `weather`.

`copilotSearch` appears when Bing puts its AI answer on the page. It holds `textBlocks`, a sequence of typed blocks where a `heading` carries a `snippet` and a `list` carries an array of them, and `references`, the pages the answer cites.

```json
{
  "textBlocks": [
    {
      "type": "heading",
      "snippet": "Top CRM software in 2026 includes Agentforce Sales, HubSpot Sales Hub, Pipedrive, Zoho CRM, and ActiveCampaign, each excelling in sales automation, pipeline management, and customer engagement."
    },
    { "type": "heading", "snippet": "Top CRM Options" },
    { "type": "list", "list": [{ "snippet": "Agentforce Sales (formerly Salesforce Sales Cloud) – Best for highly customizable..." }] }
  ],
  "references": []
}
```

## Errors and failure paths

Plan for these rather than assuming a happy path.

**The result count is not ten and does not hold still.** The same query returned 6 organic results on one call and 14 on another, because Bing decides how much of the page to give to ads and to Copilot. Read the array length rather than assuming a page size, and do not compute a rank position by multiplying page number by ten.

**`ads` and `copilotSearch` are absent rather than empty when the page has neither.** Test for the key before you read it. A query like `weather` came back with organic results alone.

**An ad `link` is a Bing click tracker, not the advertiser's URL.** It points at `bing.com/aclk` with the destination encoded inside. Read `displayedLink` for the domain that was advertising, and treat the tracker as a click-through rather than as a page address.

**`lat` and `lon` override `location`.** Sending all three silently ignores the free text. Send one or the other.

**`mkt`, `cc` and `setLang` are three separate axes.** The market decides which Bing index answers, the country code decides the origin, and the language decides the interface and the preferred result language. Setting only one moves the results less than you expect.

**`filters` is a raw Bing filter string.** The date options are documented, `ex1:"ez1"` for the past day through `ex1:"ez3"` for the past month. For anything else, run the search in a browser and copy the parameter out of the Bing URL, because the values are Bing's rather than ours.

**Paging is by offset, and pages overlap a little.** `first: 11` is the second page. Consecutive pages shared one result out of six in our checks, which is Bing being Bing rather than a fault. Deduplicate by link when you merge pages.

Results that carry data also carry a `requestMetadata.id` worth quoting in support.

## Pricing, free tier and limits

The Bing tool costs **10 credits per successful call**. Response size does not change the price.

The free tier is **1,000 credits every month with no card**, which is 100 Bing calls at the base rate. It renews with the billing cycle, so a low-volume agent runs on the free tier indefinitely.

Paid plans start at **$59 a month** for 200,000 credits, which is 20,000 calls. The unit price falls with volume, from **$2.95 per 1,000 calls** on the entry plan to **$1.19** on Basic and **$0.83** across the Growth tiers. Current figures live on the [pricing page](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp).

Your plan also sets concurrency. The free tier allows 1 request at a time, Startup 5, Basic 15, and the Growth tiers run from 50 to 500. Retry on the 429 with a backoff in anything unattended, because an agent that sweeps a keyword list will reach the ceiling before you do.

A request that comes back non-200 is not billed. A successful call that finds nothing is still a call.

## How it compares

Microsoft retired the Bing Search APIs on 11 August 2025, and the old endpoints now answer 410. Developers are routed to Grounding with Bing Search in Azure AI Agent Service, which is a different product rather than a renamed endpoint.

| | Grounding with Bing Search | This server |
| :--- | :--- | :--- |
| Eligibility | An Azure subscription and an agent resource | An API key |
| What you get | A grounded model answer with citations | The results page, parsed |
| Ad block | Not returned | Returned when present |
| Ranking positions | Not the point of the product | `position` on every result |
| Display requirements | Bound by the grounding terms | Yours to check |
| Cost model | Per grounding call, billed through Azure | Credits |

The row that decides it is what you are asking for. Grounding is built to feed a model an answer, and rank tracking, ad monitoring and SERP comparison need the page itself. When you want an answer rather than a ranking, the Azure route is the one Microsoft supports.

## FAQ

### Is there an official Bing MCP server?

Microsoft does not publish one for search results. This one is maintained by HasData and reads public Bing pages.

### What is a Bing MCP server?

An MCP server exposes tools an AI client can call. This one turns a Bing results page into JSON an agent can reason over, without a browser or a scraping library in your stack.

### Do I need an Azure subscription or a Bing API key?

No. The only credential is your HasData key.

### Why do I get fewer than ten results?

Because Bing gives part of the page to ads and to the Copilot answer, and what is left is what you get. Six and fourteen both came back for the same query on different calls.

### Does it return the Copilot answer?

When Bing shows one, yes, as `copilotSearch` with its text blocks and references. It is absent on queries where Bing does not generate an answer.

### How do I search from another country?

Set `cc` for the country and `mkt` for the market, and add `setLang` when you also want the interface and result language to change. `location` or `lat`/`lon` narrows the origin further, to city level.

### Can I use this together with other HasData APIs?

Yes. One key covers everything, and one endpoint serves them all through the `apis` parameter. Point a client at `?apis=bing,google_serp` to get both tool sets in one connection, or at [`mcp.hasdata.com/api/mcp`](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp) for the full catalogue.

### Is HasData affiliated with Microsoft or Bing?

No. HasData is an independent service and is not affiliated with, endorsed by, or sponsored by Microsoft. Bing is a trademark of its respective owner. The tools work with publicly available data only, and you are responsible for using the results in line with Bing's terms and the law that applies to you.

### Compliance and personal data

A results page returns titles, links and snippets from third-party sites, so what comes back depends on what you searched for. A query naming a person returns pages about that person, which makes the response personal data even though the tool has no concept of one. Keep that in mind before you store result sets from name queries, and check your own obligations.

## HasData links

- [Bing Search API](https://hasdata.com/apis/bing-search-api?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp), the REST endpoint behind this tool
- [API documentation](https://docs.hasdata.com/apis/bing/serp?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp)
- [MCP server documentation](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp)
- [Pricing](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp)
- [Dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=bing-mcp)

Other HasData MCP servers: [Google Search](https://github.com/HasData/google-search-mcp), [DuckDuckGo](https://github.com/HasData/duckduckgo-mcp), [Google Maps](https://github.com/HasData/google-maps-mcp), [Google Trends](https://github.com/HasData/google-trends-mcp), [Google Flights](https://github.com/HasData/google-flights-mcp), [YouTube](https://github.com/HasData/youtube-mcp), [TikTok](https://github.com/HasData/tiktok-mcp), [Instagram](https://github.com/HasData/instagram-mcp), [Amazon](https://github.com/HasData/amazon-mcp), [Walmart](https://github.com/HasData/walmart-mcp), [Shopify](https://github.com/HasData/shopify-mcp), [Yelp](https://github.com/HasData/yelp-mcp), [Yellow Pages](https://github.com/HasData/yellowpages-mcp), [Zillow](https://github.com/HasData/zillow-mcp), [Redfin](https://github.com/HasData/redfin-mcp), [Airbnb](https://github.com/HasData/airbnb-mcp), [Booking.com](https://github.com/HasData/booking-mcp), [Indeed](https://github.com/HasData/indeed-mcp), [Glassdoor](https://github.com/HasData/glassdoor-mcp).

## Development

The launcher is a thin stdio bridge to the remote server, so there is nothing to build.

```bash
npm install
HASDATA_API_KEY=your_key_here npm test
```

The tests in `test/` assert the tool contract, the part that can break without a commit here. They check that `?apis=bing` returns the one expected tool, that its name has not changed, that it still requires `q` and carries a description, that the targeting enums this README lists are still offered, and that the key in use is actually accepted. That last check calls the tool for real and costs 10 credits, which is the price of a canary that can fail for the right reason.

One test asserts that a live commercial query still returns organic results carrying `position` and `link`. This README documents the result count as variable, so a test that pinned a count would fail for the wrong reason, and one that only listed tools would pass while the parser returned nothing.

The contract suite also runs weekly on a schedule, because the upstream tool list can change without anyone touching this repository.

## Contributing

A tool table, a response sample or a documented behaviour that does not match reality is worth an issue. There is a template for exactly that. Pull requests are welcome for the same, and for anything in the launcher.

## License

MIT, see [LICENSE](LICENSE).
