// step3-enrich-and-normalize.ts
import axios from "axios";
import { load } from "cheerio";
import fs from "fs";
import path from "path";

const LINKS_DIR = "book_links";    // input dir from previous step
const OUTPUT_DIR = "book_meta";    // output dir for enriched json
const GOOGLE_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
if (!GOOGLE_API_KEY) throw new Error("Set GOOGLE_BOOKS_API_KEY (Google Books API key)");

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

interface ProvidersFile {
    goodreadsCode: string;
    goodreadsUrl: string;
    title: string;
    author: string;
    rating: string;
    providers: ProviderLink[];
}

interface NormalizedGoogleBooks {
    id: string;
    title: string;
    subtitle?: string;
    authors: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories: string[];
    language?: string;
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
    industryIdentifiers: { type: string; identifier: string }[];
    imageLinks?: {
        smallThumbnail?: string;
        thumbnail?: string;
        small?: string;
        medium?: string;
        large?: string;
        extraLarge?: string;
    };
    infoLink?: string;
    previewLink?: string;
    canonicalVolumeLink?: string;
}

interface GoodreadsMeta {
    url: string;
    description: string | null;
    isbn: string | null;
    isbn13: string | null;
    asin: string | null;
    pages: number | null;
    publicationYear: number | null;
    language: string | null;
    format: string | null; // "288 pages, Paperback"
    authorId: string | null;
    genres: string[];
}

interface FinalBook {
    id: string; // goodreadsCode
    title: string;
    author: string;
    rating: string;
    goodreads: GoodreadsMeta;
    googleBooks?: NormalizedGoogleBooks;
    links: {
        providers: ProviderLink[];
        googleBooks?: {
            infoLink?: string;
            previewLink?: string;
            canonicalVolumeLink?: string;
        };
        images?: NormalizedGoogleBooks["imageLinks"];
    };
}

const goodreadsAxios = axios.create({
    baseURL: "https://www.goodreads.com",
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 20000,
});

const googleAxios = axios.create({
    baseURL: "https://www.googleapis.com/books/v1",
    timeout: 20000,
});

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

// parse new goodreads layout (the html you pasted)
function parseGoodreadsDetails(html: string, base: ProvidersFile): GoodreadsMeta {
    const $ = load(html);

    // description
    let description: string | null = null;
    const descNode = $('[data-testid="description"] .Formatted').first();
    if (descNode.length) {
        const text = descNode.text().trim();
        if (text) description = text;
    }

    // genres
    const genres: string[] = [];
    $(
        '[data-testid="genresList"] .BookPageMetadataSection__genreButton .Button__labelItem'
    ).each((_, el) => {
        const g = $(el).text().trim();
        if (g) genres.push(g);
    });

    // featured details
    let pages: number | null = null;
    let publicationYear: number | null = null;

    const pagesText = $('[data-testid="pagesFormat"]').text();
    const mPages = pagesText.match(/(\d+)\s+pages/i);
    if (mPages) pages = parseInt(mPages[1], 10);

    const pubText = $('[data-testid="publicationInfo"]').text();
    const mYear = pubText.match(/(\d{4})/);
    if (mYear) publicationYear = parseInt(mYear[1], 10);

    // edition details
    let isbn: string | null = null;
    let isbn13: string | null = null;
    let asin: string | null = null;
    let language: string | null = null;
    let format: string | null = null;

    $(".EditionDetails .DescListItem").each((_, el) => {
        const label = $(el).find("dt").text().trim().toLowerCase();
        const contentNode = $(el).find(".TruncatedContent__text").first();
        const valueText = contentNode.text().trim();

        if (label === "isbn") {
            // example: "9780060929879 (ISBN10: 0060929871)"
            const txt = valueText.replace(/\s+/g, " ");
            const m13 = txt.match(/(\d{13})/);
            const m10 = txt.match(/ISBN10:\s*([\dX]{10})/i);
            if (m13) isbn13 = m13[1];
            if (m10) isbn = m10[1];
        } else if (label === "asin") {
            const asinSpan = $(el).find('[data-testid="asin"]').text().trim();
            asin = asinSpan || valueText || null;
        } else if (label === "language") {
            language = valueText || null;
        } else if (label === "format") {
            format = valueText || null; // "288 pages, Paperback"
            if (!pages) {
                const m = valueText.match(/(\d+)\s+pages/i);
                if (m) pages = parseInt(m[1], 10);
            }
        } else if (label === "published" && !publicationYear) {
            const m = valueText.match(/(\d{4})/);
            if (m) publicationYear = parseInt(m[1], 10);
        }
    });

    // author id
    let authorId: string | null = null;
    const authorHref =
        $(".BookPageMetadataSection__contributor a.ContributorLink")
            .first()
            .attr("href") || "";
    const mAuth = authorHref.match(/author\/show\/([^/?#]+)/);
    if (mAuth) authorId = mAuth[1];

    return {
        url: base.goodreadsUrl,
        description,
        isbn,
        isbn13,
        asin,
        pages,
        publicationYear,
        language,
        format,
        authorId,
        genres,
    };
}

// google books lookup, prefer isbn, fall back to title + author
async function fetchGoogleBooksSmart(
    title: string,
    author: string,
    isbn13?: string | null
): Promise<NormalizedGoogleBooks | null> {
    const params: any = {};
    if (isbn13) {
        params.q = `isbn:${isbn13}`;
    } else {
        // simple but effective title + author search
        const safeTitle = title.replace(/"/g, "");
        const safeAuthor = author.replace(/"/g, "");
        params.q = `intitle:${safeTitle}+inauthor:${safeAuthor}`;
    }
    if (GOOGLE_API_KEY) params.key = GOOGLE_API_KEY;

    const res = await googleAxios.get("/volumes", { params });
    const data = res.data;
    if (!data.items || !data.items.length) return null;

    const item = data.items[0];
    const info = item.volumeInfo || {};

    const normalized: NormalizedGoogleBooks = {
        id: item.id,
        title: info.title || "",
        subtitle: info.subtitle,
        authors: info.authors || [],
        publisher: info.publisher,
        publishedDate: info.publishedDate,
        description: info.description,
        pageCount: info.pageCount,
        categories: info.categories || [],
        language: info.language,
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,
        maturityRating: info.maturityRating,
        industryIdentifiers: info.industryIdentifiers || [],
        imageLinks: info.imageLinks,
        infoLink: info.infoLink,
        previewLink: info.previewLink,
        canonicalVolumeLink: info.canonicalVolumeLink,
    };

    return normalized;
}

(async () => {
    if (!fs.existsSync(LINKS_DIR)) {
        console.error(`links dir not found: ${LINKS_DIR}`);
        process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const files = fs.readdirSync(LINKS_DIR).filter((f) => f.endsWith(".json"));
    console.log(`found ${files.length} provider files`);

    for (const file of files) {
        const srcPath = path.join(LINKS_DIR, file);
        const raw = fs.readFileSync(srcPath, "utf-8");
        const base: ProvidersFile = JSON.parse(raw);

        const outPath = path.join(OUTPUT_DIR, file);
        if (fs.existsSync(outPath)) {
            console.log(`skip ${base.title} — enriched file already exists`);
            continue;
        }

        console.log(`\nprocessing ${base.title} (${base.goodreadsCode})`);

        // 1) goodreads main page
        let html: string;
        try {
            const res = await goodreadsAxios.get(base.goodreadsUrl);
            html = res.data;
        } catch (err) {
            console.error(
                "  failed to fetch goodreads page:",
                err instanceof Error ? err.message : err
            );
            continue;
        }

        const goodreadsData = parseGoodreadsDetails(html, base);
        console.log(
            `  goodreads isbn: ${goodreadsData.isbn} / isbn13: ${goodreadsData.isbn13}`
        );

        // 2) google books
        let googleBooksNorm: NormalizedGoogleBooks | null = null;
        try {
            googleBooksNorm = await fetchGoogleBooksSmart(
                base.title,
                base.author,
                goodreadsData.isbn13
            );
            if (googleBooksNorm) {
                console.log(
                    `  google books: "${googleBooksNorm.title}" (${googleBooksNorm.categories.join(
                        ", "
                    )})`
                );
            } else {
                console.log("  google books: no result");
            }
        } catch (err) {
            console.error(
                "  google books failed:",
                err instanceof Error ? err.message : err
            );
        }

        // optional backfill of isbn fields from google if goodreads missed them
        if (googleBooksNorm) {
            if (!goodreadsData.isbn13) {
                const id13 = googleBooksNorm.industryIdentifiers?.find(
                    (id) => id.type === "ISBN_13"
                );
                if (id13) goodreadsData.isbn13 = id13.identifier.replace(/-/g, "");
            }
            if (!goodreadsData.isbn) {
                const id10 = googleBooksNorm.industryIdentifiers?.find(
                    (id) => id.type === "ISBN_10"
                );
                if (id10) goodreadsData.isbn = id10.identifier.replace(/-/g, "");
            }
        }

        const finalBook: FinalBook = {
            id: base.goodreadsCode,
            title: base.title,
            author: base.author,
            rating: base.rating,
            goodreads: goodreadsData,
            googleBooks: googleBooksNorm || undefined,
            links: {
                providers: base.providers,
                googleBooks: googleBooksNorm
                    ? {
                        infoLink: googleBooksNorm.infoLink,
                        previewLink: googleBooksNorm.previewLink,
                        canonicalVolumeLink: googleBooksNorm.canonicalVolumeLink,
                    }
                    : undefined,
                images: googleBooksNorm?.imageLinks,
            },
        };

        fs.writeFileSync(outPath, JSON.stringify(finalBook, null, 2), "utf-8");
        console.log(`  saved -> ${outPath}`);

        // chill a bit between books
        await sleep(1500);
    }

    console.log("\nall done.");
})();
