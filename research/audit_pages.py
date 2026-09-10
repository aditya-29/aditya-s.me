"""Extract concise homepage evidence from locally downloaded public references."""
import json
import re
from html.parser import HTMLParser
from pathlib import Path


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.text = []
        self.headings = []
        self.links = []
        self.images = 0
        self.heading = None
        self.title = ''
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'):
            self.skip += 1
        if tag == 'title': self.in_title = True
        if tag in ('h1', 'h2', 'h3'): self.heading = ''
        if tag == 'a': self.links.append(attrs.get('href', ''))
        if tag == 'img': self.images += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)
        if tag == 'title': self.in_title = False
        if tag in ('h1', 'h2', 'h3') and self.heading is not None:
            self.headings.append(self.heading.strip()); self.heading = None

    def handle_data(self, data):
        if self.skip: return
        if self.in_title: self.title += data
        if self.heading is not None: self.heading += data
        value = ' '.join(data.split())
        if value: self.text.append(value)


rows = []
for i, (name, url) in enumerate(json.loads(Path('research/sites.json').read_text())):
    path = Path(f'/private/tmp/researcher-pages/{i}.html')
    if not path.exists(): continue
    page = Page()
    page.feed(path.read_text(errors='replace'))
    text = ' '.join(page.text)
    signals = []
    for label, pattern in [('publications', r'publications|selected papers|research papers'), ('CV', r'curriculum vitae|\bcv\b'), ('email', r'@|\[at\]|\(at\)'), ('teaching', r'teaching|courses'), ('news', r'\bnews\b|updates'), ('code', r'github|\bcode\b'), ('Scholar', r'scholar.google')]:
        if re.search(pattern, text + ' '.join(page.links), re.I): signals.append(label)
    short_headings = []
    remaining = 14
    for heading in page.headings:
        words = heading.split()[:remaining]
        if words:
            short_headings.append(' '.join(words))
            remaining -= len(words)
        if remaining == 0: break
    row = {'id': i, 'name': name, 'url': url, 'title': ' '.join(page.title.split()[:10]), 'headings': short_headings, 'signals': signals, 'images': page.images, 'words': len(text.split())}
    rows.append(row)
Path('research/page-evidence.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n')
for row in rows:
    print(json.dumps(row, ensure_ascii=False))
