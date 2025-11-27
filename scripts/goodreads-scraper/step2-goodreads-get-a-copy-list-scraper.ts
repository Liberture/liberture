// step2-get-links.ts
import axios from "axios";
import { load } from "cheerio";
import fs from "fs";
import path from "path";

const INPUT_CSV = "biopunk_225_titles.csv"; // from step1
const OUTPUT_DIR = "book_links";            // where we store per book json

interface ProviderLink {
    name: string;
    providerId: string | null;
    bookId: string | null;
    mainUrl: string;
    search: {
        isbn?: string;
        title?: string;
    };
}

interface BookLinks {
    goodreadsCode: string;
    goodreadsUrl: string;
    title: string;
    author: string;
    rating: string;
    providers: ProviderLink[];
}

const axiosInstance = axios.create({
    baseURL: "https://www.goodreads.com",
    headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 20000,
});

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

// extremely simple csv parser for your specific format:
// "field1","field2","field3","field4"
function parseCsvLine(line: string): [string, string, string, string] | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "" || trimmed === '"Title","Author","Rating","Goodreads URL"') {
        return null;
    }

    // remove leading and trailing quote
    const withoutOuterQuotes = trimmed.replace(/^"|"$/g, "");
    const parts = withoutOuterQuotes.split('","');

    if (parts.length !== 4) {
        console.warn("unexpected csv line, skipping:", line);
        return null;
    }

    const [title, author, rating, goodreadsUrl] = parts;
    return [title, author, rating, goodreadsUrl];
}

function extractGoodreadsCode(goodreadsUrl: string): string | null {
    // examples:
    // https://www.goodreads.com/book/show/5129.Brave_New_World
    // maybe with query params
    const m = goodreadsUrl.match(/\/book\/show\/([^/?#]+)/);
    if (!m) return null;
    return m[1]; // 5129.Brave_New_World
}

async function fetchLinksForBook(
    goodreadsCode: string,
    meta: { title: string; author: string; rating: string; goodreadsUrl: string }
): Promise<BookLinks | null> {
    const url = `/book/${goodreadsCode}/get_a_copy`;
    console.log(`  fetching ${url}`);

    let html: string;
    try {
        const res = await axiosInstance.get(url);
        html = res.data;
    } catch (err) {
        console.error("  failed to fetch get_a_copy:", err instanceof Error ? err.message : err);
        return null;
    }

    const $ = load(html);
    const providers: ProviderLink[] = [];

    $("ol.bookLink > li").each((_, el) => {
        const mainAnchor = $(el).find("a.actionLinkLite").first();
        if (!mainAnchor.length) return;

        const name = mainAnchor.text().trim();
        const href = mainAnchor.attr("href") || "";

        const mainUrl = new URL(href, "https://www.goodreads.com").toString();

        // try to extract providerId and bookId from the href
        // /book_link/follow/1?book_id=5129&source=compareprices
        const providerMatch = href.match(/\/book_link\/follow\/(\d+)/);
        const bookIdMatch = href.match(/book_id=(\d+)/);

        const providerId = providerMatch ? providerMatch[1] : null;
        const bookId = bookIdMatch ? bookIdMatch[1] : null;

        const searchBlock = $(el).find("div.greyText.smallText").first();
        const search: { isbn?: string; title?: string } = {};

        if (searchBlock.length) {
            searchBlock.find("a").each((_, a) => {
                const text = $(a).text().trim().toLowerCase();
                const href = $(a).attr("href") || "";
                const url = new URL(href, "https://www.goodreads.com").toString();

                if (text.includes("isbn")) {
                    search.isbn = url;
                } else if (text.includes("title")) {
                    search.title = url;
                }
            });
        }

        providers.push({
            name,
            providerId,
            bookId,
            mainUrl,
            search,
        });
    });

    console.log(`  found ${providers.length} providers`);

    return {
        goodreadsCode,
        goodreadsUrl: meta.goodreadsUrl,
        title: meta.title,
        author: meta.author,
        rating: meta.rating,
        providers,
    };
}

(async () => {
    if (!fs.existsSync(INPUT_CSV)) {
        console.error(`input csv not found: ${INPUT_CSV}`);
        process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const csv = fs.readFileSync(INPUT_CSV, "utf-8");
    const lines = csv.split(/\r?\n/);

    console.log(`loaded ${lines.length} lines from ${INPUT_CSV}`);

    for (const line of lines) {
        const parsed = parseCsvLine(line);
        if (!parsed) continue;

        const [title, author, rating, goodreadsUrl] = parsed;
        const code = extractGoodreadsCode(goodreadsUrl);

        if (!code) {
            console.warn("could not extract goodreads code for:", goodreadsUrl);
            continue;
        }

        const outPath = path.join(OUTPUT_DIR, `${code}.json`);

        if (fs.existsSync(outPath)) {
            console.log(`skip ${title} (${code}) — json already exists`);
            continue;
        }

        console.log(`\nprocessing: ${title} (${code})`);

        const bookLinks = await fetchLinksForBook(code, {
            title,
            author,
            rating,
            goodreadsUrl,
        });

        if (!bookLinks) {
            console.log("  no data, skipping save");
            continue;
        }

        fs.writeFileSync(outPath, JSON.stringify(bookLinks, null, 2), "utf-8");
        console.log(`  saved -> ${outPath}`);

        // tiny delay to be nice
        await sleep(1500);
    }

    console.log("\nall done.");
})();
