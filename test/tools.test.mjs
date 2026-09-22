// Tool contract test.
//
// The README promises one tool with a specific name and parameter set. The upstream list can
// change without a single commit here, and the README would start lying silently. These checks
// catch that before a user does.
//
// One live call serves two checks. Listing tools accepts any non-empty key, so a contract check
// that only lists tools stays green with a revoked or mistyped key, and it would also stay green
// if the parser returned an empty page. The same response answers both. That call costs 10
// credits, which is the price of a canary that can fail for the right reason.
//
// Run: HASDATA_API_KEY=your_key_here npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

const ENDPOINT = 'https://mcp.hasdata.com/mcp?apis=bing';
const KEY = process.env.HASDATA_API_KEY;
const TIMEOUT_MS = 30_000;

const TOOL = 'hasdata_bing_serp_getSearchResults';
const REQUIRED = ['q'];

// Targeting values the README lists by name.
const ENUMS = {
    safeSearch: ['off', 'moderate', 'strict'],
    deviceType: ['desktop', 'mobile', 'tablet'],
};

// Parameters the README documents without listing every value.
const PARAMS = ['location', 'lat', 'lon', 'mkt', 'cc', 'setLang', 'filters', 'first'];

// A streamable HTTP body arrives either as plain JSON or as server-sent events. One SSE event
// can span several data: lines, several events can share one response, and a server is free to
// send progress notifications before the answer. So collect every event and pick the message
// carrying our request id instead of trusting the first data: line.
function parseRpc(raw, id) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);

    const messages = [];
    for (const event of trimmed.split(/\r?\n\r?\n+/)) {
        const data = event
            .split(/\r?\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
        if (!data || data === '[DONE]') continue;
        try {
            messages.push(JSON.parse(data));
        } catch {
            // A keep-alive or a partial event is not our response.
        }
    }
    assert.ok(messages.length, `no JSON-RPC message in the response: ${raw.slice(0, 300)}`);
    const match = messages.find((m) => m.id === id);
    assert.ok(match, `no message with id ${id} in the response: ${raw.slice(0, 300)}`);
    return match;
}

let nextId = 1;

async function rpc(method, params = {}) {
    // The CI key sits on the free plan, where concurrency is 1. When several of
    // these repos are pushed at once their contract runs collide, and HasData
    // answers 429 with code concurrency_limit straight away rather than queueing.
    // That is a plan limit, not a broken contract, so the call is retried before
    // the test gives up. A 401 still fails on the first attempt.
    for (let attempt = 1; ; attempt++) {
        const id = nextId++;
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'x-api-key': KEY,
                'Content-Type': 'application/json',
                // The server answers over streamable HTTP, so accept both a plain body and a stream.
                Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        assert.equal(res.status, 200, `${method} returned ${res.status}`);
        const raw = await res.text();
        if (raw.includes('concurrency_limit') && attempt < 5) {
            await new Promise((r) => setTimeout(r, attempt * 4000));
            continue;
        }
        return { raw, body: parseRpc(raw, id) };
    }
}

// One network round trip for every test that needs the list.
let toolsPromise;
function listTools() {
    toolsPromise ??= rpc('tools/list').then(({ body }) => {
        assert.ok(body.result?.tools, 'the response carried no result.tools');
        return body.result.tools;
    });
    return toolsPromise;
}

// One paid round trip, shared by the checks that need a real answer.
let searchPromise;
function liveSearch() {
    searchPromise ??= rpc('tools/call', {
        name: TOOL,
        arguments: { q: 'python web scraping tutorial' },
    });
    return searchPromise;
}

const live = { skip: KEY ? false : 'HASDATA_API_KEY is not set, skipping the live checks' };

test('apis=bing exposes the documented tool and nothing else', live, async () => {
    const tools = await listTools();
    const names = tools.map((t) => t.name).sort().join(', ');
    assert.equal(tools.length, 1, `expected 1 tool, got ${tools.length}: ${names}`);
    assert.equal(tools[0].name, TOOL, `the tool is now called ${tools[0].name}`);
});

test('the tool still requires its search term and carries a description', live, async () => {
    const [tool] = await listTools();
    const required = tool.inputSchema?.required ?? [];
    for (const param of REQUIRED) {
        assert.ok(required.includes(param), `${TOOL} should require ${param}, declares: ${required.join(', ') || 'nothing'}`);
    }
    assert.ok((tool.description || '').trim().length > 20, `${TOOL} has an empty or near-empty description`);
});

test('the targeting parameters the README documents are still in the schema', live, async () => {
    const [tool] = await listTools();
    const props = tool.inputSchema?.properties ?? {};
    for (const param of PARAMS) {
        assert.ok(props[param], `${TOOL} no longer accepts ${param}`);
    }
    for (const [param, values] of Object.entries(ENUMS)) {
        const offered = props[param]?.enum ?? [];
        for (const value of values) {
            assert.ok(offered.includes(value), `${param} no longer accepts ${value}, offers: ${offered.join(', ') || 'no enum'}`);
        }
    }
});

test('the key is accepted by HasData', live, async () => {
    const { raw } = await liveSearch();
    assert.ok(!raw.includes('401 Unauthorized'), 'HasData rejected the key');
    assert.ok(!raw.includes('"isError":true'), `the tool call failed: ${raw.slice(0, 300)}`);
});

// A tools/list check passes while the parser returns an empty page, and the README warns that
// the result count moves, so pinning a count would fail for the wrong reason. This asserts the
// shape instead: results arrive, and each one carries the fields the README documents.
test('a live search still returns parsed organic results', live, async () => {
    const { body } = await liveSearch();
    const text = body.result?.content?.[0]?.text ?? '';
    const payload = JSON.parse(text);
    const results = payload.json?.organicResults;

    assert.ok(Array.isArray(results), `no organicResults array in the response: ${text.slice(0, 300)}`);
    assert.ok(results.length, 'organicResults came back empty, so the page was not parsed');

    for (const r of results) {
        assert.equal(typeof r.position, 'number', `a result carried no numeric position: ${JSON.stringify(r).slice(0, 160)}`);
        assert.ok(r.link, `a result carried no link: ${JSON.stringify(r).slice(0, 160)}`);
        assert.ok(r.title, `a result carried no title: ${JSON.stringify(r).slice(0, 160)}`);
    }
});
