# Validation — September 8, 2026

## Browser checks

`node checks/browser.cjs` passed in Chrome 152 at 320, 375, 390, 640, 768, 1024, and 1440 pixels. See [the generated report](artifacts/report.json).

- No horizontal overflow or failed local resources.
- No automated accessibility violations for the configured WCAG A/AA rules.
- Navigation anchors and keyboard skip link work.
- Four publication entries and four working citation downloads.
- Page remains readable and navigable without JavaScript.
- Graph animation changes frames and respects reduced-motion preferences.
- Reduced-motion startup and live preference changes keep the graph static.
- High-density rendering is capped; resizing to mobile preserves functioning animation.
- Print output generated.
- Desktop, tablet, and mobile screenshots manually inspected for typography, alignment, content order, spacing, and clipping.

The current sidebar layout and graph background were checked at the same seven widths. On mobile, the motion control sits in the header so it cannot obscure publication text.

## External publication resources

HEAD checks followed redirects. This verifies reachability at the time of checking, not perpetual availability.

| Destination | Result |
| --- | --- |
| REVEAL on Amazon Science | HTTP 200 |
| REVEAL camera-ready PDF | HTTP 200 |
| DeepCodeSeek on arXiv | HTTP 200 |
| DeepCodeSeek proceedings PDF | HTTP 200 |
| Agentic ECG direct medRxiv page | HTTP 200 |
| Agentic ECG PDF | HTTP 200 |
| Sleep apnea DOI → IEEE document 9579656 | HTTP 202; publisher controls automated access. DOI corroborated against bibliographic metadata. |

The ECG DOI resolver redirected to HTTP and returned 403. The visible page links now use the verified direct HTTPS medRxiv URL. The DOI is retained in its citation as the persistent identifier.

LinkedIn and Scholar remain the user-supplied profile links. Their automated-access restrictions mean complete career text and bibliography could not be imported.

## Practical limits

No deployment was performed. Physical-device, Safari/Firefox, and assistive-technology testing were not performed. Automated accessibility checks do not establish full conformance. User-supplied career details and contact assets are still needed as listed in the README.
