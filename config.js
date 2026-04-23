// ============================================================
//  THE VAULT — MULTI-PROJECT CONFIGURATION
// ============================================================
//
//  HOW TO ADD A NEW PROJECT:
//  1. Create folder:  images/projects/your-project-id/
//  2. Add cover art:  images/projects/your-project-id/cover.webp
//  3. For image projects (manga/graphic-novel/comic):
//       images/projects/your-project-id/ch1/page-1.webp, page-2.webp …
//  4. For light novels:
//       content/your-project-id/ch1.html  (just the chapter text as HTML)
//  5. Add a project entry below
//  6. Re-deploy to Netlify
//
//  HOW TO ADD A CHAPTER TO AN EXISTING PROJECT:
//  1. Add images or content file for the new chapter
//  2. Add entry to the project's "chapters" array below
//  3. Re-deploy
// ============================================================

const CONFIG = {

  /* ---- Site-Wide Settings ---- */
  siteName: "THE VAULT",
  siteTagline: "Manga · Light Novels · Graphic Novels",
  author: "Ololade Suberu",
  description: "A curated library of original stories by Ololade Suberu. Read manga, light novels, and graphic novels — all free, all original.",

  social: {
    twitter:   "",
    instagram: "",
    tiktok:    "",
    email:     ""
  },

  defaultImageExtension: "webp",

  /* ============================================================
     PROJECTS
     Supported types:
       "manga"          – image pages, right-to-left option
       "graphic-novel"  – image pages, left-to-right
       "comic"          – image pages, left-to-right
       "webtoon"        – image pages, vertical scroll
       "light-novel"    – text chapters (HTML files)
     ============================================================ */
  projects: [

    // ─── PROJECT 1: Children of Fate ───────────────────────
    {
      id: "children-of-fate",
      title: "Children of Fate",
      type: "graphic-novel",
      cover: "images/projects/children-of-fate/cover.webp",
      description: "An epic graphic novel series following heroes bound by destiny, spanning worlds and generations. When fate chooses you, there is no escape — only the courage to answer.",
      genre: ["Action", "Fantasy", "Drama"],
      status: "ongoing",          // "ongoing" | "completed" | "hiatus"
      imageExtension: "webp",     // "webp" | "png" | "jpg"
      readingDirection: "ltr",    // "ltr" | "rtl"
      chapters: [
        {
          id: 1,
          title: "The Awakening",
          subtitle: "Chapter One",
          description: "The journey begins when fate reveals its first chosen.",
          pageCount: 25,
          status: "published",
          date: "2026-04-22"
        },
        {
          id: 2,
          title: "Threads of Destiny",
          subtitle: "Chapter Two",
          description: "Paths converge as ancient forces stir beneath the surface.",
          pageCount: 30,
          status: "published",
          date: "2026-05-06"
        },
        {
          id: 3,
          title: "The First Trial",
          subtitle: "Chapter Three",
          description: "A test of will that separates the worthy from the fallen.",
          pageCount: 28,
          status: "coming-soon",
          date: ""
        },
        {
          id: 4,
          title: "Echoes of the Fallen",
          subtitle: "Chapter Four",
          description: "The past refuses to stay buried.",
          pageCount: 32,
          status: "coming-soon",
          date: ""
        }
      ]
    },

    // ─── PROJECT 2: Sample Light Novel ─────────────────────
    // (Replace or delete this — it's just an example)
    {
      id: "starbound",
      title: "Starbound",
      type: "light-novel",
      cover: "images/projects/starbound/cover.webp",
      description: "In the dying light of Earth's last colony ship, a mechanic discovers she can hear the stars — and they're screaming. A serialized light novel exploring the boundaries of human perception.",
      genre: ["Sci-Fi", "Mystery"],
      status: "ongoing",
      chapters: [
        {
          id: 1,
          title: "The Last Station",
          subtitle: "Chapter One",
          description: "She heard the stars for the first time on a Tuesday.",
          wordCount: 4500,
          status: "published",
          date: "2026-04-22"
        },
        {
          id: 2,
          title: "Frequency",
          subtitle: "Chapter Two",
          description: "The signal gets louder. The crew gets nervous.",
          wordCount: 5200,
          status: "coming-soon",
          date: ""
        }
      ]
    }

    // ↑ To add another project, copy any block above, change all values, and paste here
  ]
};
