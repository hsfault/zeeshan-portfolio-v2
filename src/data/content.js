export const profile = {
  name: "Zeeshan Ahmad",
  alias: "Leo",
  role: "Freelance Web Developer",
  location: "Gujranwala, Pakistan",
  email: "hsfault@gmail.com",
  phone: "+92 335 466 7999",
  phoneHref: "tel:+923354667999",
  github: "https://github.com/hsfault",
  instagram: "https://instagram.com/hs_fault",
};

export const navLinks = [
  { id: "origin", label: "Origin" },
  { id: "skills", label: "Skills" },
  { id: "missions", label: "Missions" },
  { id: "aria", label: "ARIA" },
  { id: "services", label: "Services" },
  { id: "signal", label: "Contact" },
];

export const timeline = [
  {
    year: "2024",
    title: "First line of C++",
    text: "Started coding in C++ for BSCS coursework at UCP Gujranwala: data structures, algorithms, and even Assembly on EMU8086.",
  },
  {
    year: "2025",
    title: "Discovered the web",
    text: "Found web development and started shipping mini projects, then leveled up to React + Vite + Tailwind CSS.",
  },
  {
    year: "2026",
    title: "First client missions",
    text: "Started freelancing: villa rentals, custom packaging, trading companies, and my own SaaS, ResumeIQ.",
  },
  {
    year: "June 2026",
    title: "ARIA is born",
    text: "An AI course assignment turned into something bigger: ARIA, my own desktop AI assistant.",
  },
  {
    year: "Now",
    title: "Building the studio",
    text: "Co-running Arcline Studio and taking on freelance projects for clients worldwide.",
  },
];

/* Missions
   link  — only live projects have one; no link = no "Open file" button
   media — { type: "video", src } for a vertical reel (plays in a phone frame),
           { type: "video", src, orientation: "landscape" } for a wide video,
           { type: "image", src } for a screenshot.
   Files live in public/missions/. Missing files fall back to the initials design. */
export const projects = [
  {
    title: "ResumeIQ",
    status: "Live",
    description: "AI-powered resume analyzer SaaS that helps job seekers improve their resumes.",
    tags: ["React", "AI", "SaaS"],
    link: "https://resume-iq-sigma-six.vercel.app/",
    media: { type: "image", src: "/missions/resumeiq.jpg" },
  },
  {
    title: "Reelkeep",
    status: "Android App",
    description:
      "Android app that saves reels from public Instagram profiles in batches of 50 and packs them into one ZIP — a Python engine runs inside the APK, with a React interface on top.",
    tags: ["Android", "Kotlin", "Python", "React"],
    media: { type: "video", src: "/missions/reelkeep.mp4" },
  },
  {
    title: "WEBLINE",
    status: "Android App",
    description:
      "My own custom Android launcher: a 3D home screen of tilted tiles, a custom notification panel, and a lock cover that splits open on fingerprint unlock.",
    tags: ["Android", "Launcher", "Motion UI"],
    media: { type: "video", src: "/missions/webline.mp4" },
  },
  {
    title: "Palm Bali Properties",
    status: "Client",
    description: "Villa rental website for a Bali property business.",
    tags: ["React", "Tailwind", "Client"],
    media: { type: "image", src: "/missions/palm-bali.jpg" },
  },
  {
    title: "Bespoke Boxes",
    status: "Client",
    description: "Full-stack website for a custom packaging company.",
    tags: ["Full-stack", "Client"],
    media: { type: "image", src: "/missions/bespoke-boxes.jpg" },
  },
  {
    title: "National Trader",
    status: "Live",
    description:
      "Quote-based website for an agricultural and garden equipment importer — scroll-scrubbed hero, full product catalogue and an Urdu version.",
    tags: ["Next.js", "GSAP", "Client"],
    link: "https://www.nationaltrader.org",
    media: { type: "image", src: "/missions/national-trader.jpg" },
  },
  {
    title: "Amber & Ash",
    status: "Live · Concept",
    description: "Coffee roastery concept site with a warm, editorial feel — built end to end as a teaching project.",
    tags: ["Next.js", "Tailwind", "Concept"],
    link: "https://amber-and-ash.vercel.app/",
    media: { type: "video", src: "/missions/amber-and-ash.mp4" },
  },
];

/* ---------- Skills web ----------
   level: 1 = inner web (daily driver), 2 = middle (confident), 3 = outer (exploring)
   Max 5 skills per sector. */
export const skillSectors = [
  { id: "build", label: "Build" },
  { id: "motion", label: "Motion & 3D" },
  { id: "craft", label: "Design & Growth" },
  { id: "core", label: "Foundations" },
];

export const skills = [
  { name: "React", code: "RCT", sector: "build", level: 1, note: "My primary stack — nearly every build starts here." },
  { name: "Vite", code: "VIT", sector: "build", level: 1, note: "Instant dev server, lean builds. Paired with React on every project." },
  { name: "Tailwind CSS", code: "TWD", sector: "build", level: 1, note: "Mobile-first styling, straight in the markup." },
  { name: "Next.js", code: "NXT", sector: "build", level: 2, note: "For client sites that need routing and SEO baked in." },
  { name: "WordPress", code: "WP", sector: "build", level: 2, note: "For clients who want to edit their own content." },

  { name: "Framer Motion", code: "FRM", sector: "motion", level: 1, note: "The animation engine behind most of this site." },
  { name: "Lenis", code: "LNS", sector: "motion", level: 1, note: "Smooth scrolling that makes motion feel expensive." },
  { name: "GSAP", code: "GSP", sector: "motion", level: 2, note: "ScrollTrigger timelines for the big, cinematic builds." },
  { name: "Three.js", code: "3JS", sector: "motion", level: 3, note: "The 3D in this very portfolio — splash and hero." },

  { name: "Graphic Design", code: "GFX", sector: "craft", level: 2, note: "Logos, social posts and brand visuals." },
  { name: "Email Marketing", code: "EML", sector: "craft", level: 2, note: "Campaigns that bring visitors back." },
  { name: "Social Media", code: "SMM", sector: "craft", level: 2, note: "Content and growth for brand pages." },

  { name: "C++ & DSA", code: "C++", sector: "core", level: 2, note: "Where it all started — data structures and algorithms." },
  { name: "Python", code: "PY", sector: "core", level: 2, note: "Scripting, tooling, and backend work." },
  { name: "FastAPI", code: "API", sector: "core", level: 3, note: "The backend behind ARIA." },
  { name: "Assembly", code: "ASM", sector: "core", level: 3, note: "EMU8086 — learning how the machine actually thinks." },
];

/* ---------- Services (the Loadout drum) ---------- */
export const services = [
  {
    code: "WEB",
    title: "Website Development",
    blurb: "Fast, animated, mobile-first websites built with React, Vite and Tailwind.",
    deliverables: [
      "Custom design — no templates",
      "Mobile-first and fully responsive",
      "Smooth scrolling and motion",
      "SEO-ready structure",
      "Deployed and handed over",
    ],
    stack: ["React", "Vite", "Tailwind"],
  },
  {
    code: "3D",
    title: "Motion & 3D Web",
    blurb: "Scroll-driven animation and real-time 3D that make a site feel alive.",
    deliverables: [
      "Framer Motion and Lenis scroll experiences",
      "Three.js / React Three Fiber scenes",
      "GSAP ScrollTrigger for cinematic builds",
      "Tuned to stay smooth on mobile",
    ],
    stack: ["Framer Motion", "Three.js", "GSAP"],
  },
  {
    code: "WP",
    title: "WordPress Sites",
    blurb: "Easy-to-manage WordPress sites for businesses that want to edit their own content.",
    deliverables: ["Theme setup and customisation", "Editable pages and blog", "Contact forms", "Basic SEO setup"],
    stack: ["WordPress"],
  },
  {
    code: "GFX",
    title: "Graphic Design",
    blurb: "Logos, social posts and brand visuals that match your website.",
    deliverables: ["Logo and brand basics", "Social media post sets", "Banners and web graphics"],
    stack: ["Brand", "Social"],
  },
  {
    code: "MKT",
    title: "Digital Marketing",
    blurb: "Email campaigns and social media marketing that bring visitors to your site.",
    deliverables: ["Email campaign setup", "Social media content plan", "Launch promotion"],
    stack: ["Email", "Social"],
  },
];