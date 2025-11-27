// step1-only-titles.ts
import axios from "axios";
import { load } from "cheerio";
import fs from "fs";

interface Book {
    title: string;
    author: string;
    rating: string;
    goodreadsUrl: string;
}

const OUTPUT = "biopunk_225_titles.csv";
const PROGRESS_FILE = "progress_titles.json";

let books: Book[] = [];
let currentPage = 1;

if (fs.existsSync(PROGRESS_FILE)) {
    const saved = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    books = saved.books;
    currentPage = saved.page;
    console.log(`Resuming from page ${currentPage} — already have ${books.length} books`);
}

const axiosInstance = axios.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 20000,
});

(async () => {
    for (; currentPage <= 3; currentPage++) {
        console.log(`\nScraping page ${currentPage}/3...`);
        let data: string;
        try {
            const res = await axiosInstance.get(
                `https://www.goodreads.com/list/show/71382.A_Biopunk_reading_list?page=${currentPage}`
            );
            data = res.data;
        } catch (e) {
            console.log("Failed to load page — stopping");
            break;
        }

        const $ = load(data);
        const rows = $("tr[itemtype='http://schema.org/Book']");
        console.log(`Found ${rows.length} books on this page`);

        for (const row of rows) {
            const title = $(row).find("a.bookTitle").text().trim();
            const author = $(row).find("a.authorName").text().trim();
            const rating = $(row).find("span.minirating").text().trim();
            const goodreadsUrl = "https://www.goodreads.com" + $(row).find("a.bookTitle").attr("href")!;

            books.push({ title, author, rating, goodreadsUrl });
            console.log(`  Success: ${title} by ${author}`);
        }

        // Save after every page
        const csv = "Title,Author,Rating,Goodreads URL\n" +
            books.map(b => `"${b.title.replace(/"/g, '""')}","${b.author}","${b.rating}","${b.goodreadsUrl}"`).join("\n");

        fs.writeFileSync(OUTPUT, csv);
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ books, page: currentPage }));

        console.log(`Page ${currentPage} saved — total: ${books.length} books`);
    }

    // Cleanup
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
    console.log(`\nDONE! All 225 books saved to ${OUTPUT}`);
})();
