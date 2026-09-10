# Aditya Shanmugham — personal website

A minimal research website with a desktop sidebar, a single reading column, and subtle animated graph geometry. No runtime dependencies or build step. The research content works without JavaScript and uses system fonts.

## Preview

Open `index.html`, or run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit http://localhost:8000. Over HTTP, the BibTeX links download individual citations.

## Publish

The included GitHub Pages workflow deploys only the site assets: `index.html`, `styles.css`, `background.js`, `favicon.svg`, `IMG_1228.jpeg`, `CNAME`, `.nojekyll`, and `citations/`. `research/` and `checks/` remain repository documentation and are not published. The site is configured for `https://aditya-s.me/`.

After creating the GitHub repository, set Pages to use **GitHub Actions** and configure the domain’s DNS records at its registrar. Update the footer date when editing content. A social preview image can be added when an appropriate asset is available.

## Editing

- Biography, publications, and experience: `index.html`.
- Layout, colors, typography, mobile, and print styles: `styles.css`.
- Animated background: `background.js`. Uses native Canvas 2D; no backend service or external library.
- Profile portrait: `IMG_1228.jpeg`. The sidebar crops it to a face-forward circular image; update the file or its CSS `object-position` to use a different photo.
- Network-symbol favicon: `favicon.svg`.
- Downloadable references: `citations/*.bib`. Keep these aligned with the corresponding paper entries.

Publications are manually maintained. This is not an automatic Google Scholar integration; the supplied Scholar link remains the destination for the full bibliography.

## Graph background

The desktop background draws a hypercube graph (16 vertices, 32 edges) and an icosahedron graph (12 vertices, 30 edges). Vertex positions rotate and interpolate between spatial and circular layouts while adjacency stays fixed: different drawings of isomorphic graphs. These are generative mathematical visuals, not live analytics or external data.

Rendering is capped at 30 frames per second and a device pixel ratio of 1.5. The geometry subtly responds to pointer position. On mobile, a scaled ambient graph field remains fixed behind the viewport rather than taking up space in the reading flow. Edges behind the reading column are dimmed. Motion stops when the tab is hidden; the operating system’s reduced-motion preference starts the visual as a static drawing and is honored immediately. Without JavaScript, the page stays readable. The graph is omitted from print output.

## Research and design review

See [research/REVIEW.md](research/REVIEW.md): 113 distinct personal researcher pages inspected for content and structure, plus a visual comparison of twelve representative pages. The document lists every counted reference, distinguishes the two review methods, and explains the design decisions. Unavailable or empty pages do not count toward 113.

## Verification

The browser check uses Playwright and axe-core. Development tools are installed outside this website, in `/private/tmp/personal-site-tools/node_modules` for this session. To recreate them:

```sh
npm install --prefix /private/tmp/personal-site-tools playwright @axe-core/playwright
node checks/browser.cjs
```

It requires Google Chrome, starts a temporary loopback server, and writes `checks/artifacts/`. The `SITE_TEST_MODULES` environment variable can point to another installation of those packages.

Validated at widths 320, 375, 390, 640, 768, 1024, and 1440 pixels:

- No horizontal overflow, page errors, or missing local resources.
- No automated WCAG A/AA violations reported by axe for the configured 2.0–2.2 rules.
- Valid internal destinations and working keyboard skip/navigation links.
- All four BibTeX links download successfully.
- Main content and navigation work with JavaScript disabled.
- Animation changes rendered frames; pause freezes them and resume restarts them.
- Reduced-motion startup/preference changes, canvas resizing, and capped pixel density pass.
- Print PDF generated; desktop, tablet, and mobile screenshots visually inspected.

Automated accessibility checks are not a complete manual accessibility certification. Testing used desktop Chrome and emulated viewport sizes, not physical phones or every browser.

## Content provenance

Reviewed September 8, 2026. Wording is deliberately restrained and distinguishes coauthored research from personal ownership claims.

| Content | Basis |
| --- | --- |
| Applied Scientist, Amazon AGI, Nova foundation models | Supplied by Aditya. Training/evaluation focus also appears in his [role announcement](https://www.linkedin.com/posts/aditya-shanmugham_amazon-appliedscientist-nova-activity-7362176693186228224-PTdJ). Post-training, reinforcement learning, and data ablations are supplied by Aditya. |
| Nova 2 technical report link | Official [Amazon Science publication](https://www.amazon.science/publications/amazon-nova-2-multimodal-reasoning-and-generation-models). The report attributes the work to Amazon Artificial General Intelligence, so the site describes it as an official report rather than making an individual authorship claim. |
| ServiceNow, Machine Learning Engineer (GenAI) | [Aditya’s joining announcement](https://www.linkedin.com/posts/aditya-shanmugham_newbeginnings-machinelearning-genai-activity-7209456984817856512-HqTC), which describes working on LLM integration into the platform. The text-to-code focus is supplied by Aditya. |
| CoreLLM team | Supplied by Aditya. The complete LinkedIn experience description remains inaccessible and has not been copied. |
| ServiceNow API retrieval research | Coauthorship and ServiceNow affiliation in the [DeepCodeSeek paper](https://ceur-ws.org/Vol-4075/paper6.pdf). No claim about sole ownership or team leadership. |
| Northeastern University, 2022–2024 | Publicly indexed [LinkedIn profile](https://www.linkedin.com/in/aditya-shanmugham/). Exact degree omitted pending confirmation. |
| REVEAL, authors, year, workshops, PDF | [Amazon Science](https://www.amazon.science/publications/stress-tests-reveal-fragile-temporal-and-visual-grounding-in-video-language-models). Bibliographic authors follow this source. |
| DeepCodeSeek, authors, summary | [arXiv](https://arxiv.org/abs/2509.25716). |
| DeepCodeSeek workshop venue | [GeCoIn 2025 proceedings](https://ceur-ws.org/Vol-4075/). |
| Agentic ECG paper, authors, year, preprint status | [medRxiv](https://www.medrxiv.org/content/10.64898/2026.06.17.26355897v1), corroborated by [PubMed](https://pubmed.ncbi.nlm.nih.gov/42396274/). |
| Sleep apnea title, authors, conference, DOI | [Proceedings contents](https://www.proceedings.com/content/060/060961webtoc.pdf) and [bibliographic record](https://dblp.org/rec/conf/icccnt/ShanmughamSGCK21). The paper now links directly through its DOI. |

## Details still needed from Aditya

- Exact CoreLLM LinkedIn description and employment dates.
- Exact degree name.
- Actual CV file.
- Scholar export to confirm bibliography completeness.

These omissions are intentional; the page has no placeholder buttons, guessed personal details, invented impact metrics, or claims of automatic synchronization.
