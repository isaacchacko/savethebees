# library — the Chrome extension

CRUD for the lists on [/library](https://isaacchacko.com/library) (the site's
**library** tab), and an editor for the rest of the site, from the browser.

There is no server in the loop. The extension edits `content/cool.json` in this
repo directly through the GitHub contents API; Vercel sees the commit and
rebuilds the page. So every save is a commit, and the page is live roughly a
minute later.

## Install

1. `chrome://extensions` → turn on **Developer mode**.
2. **Load unpacked** → pick this `extension/` folder.
3. Pin it to the toolbar.

## Set up the token

Make a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new):

- **Repository access**: only `isaacchacko/savethebees`
- **Permissions → Repository → Contents**: _Read and write_
- Expiry: whatever you are willing to re-do

Open the extension's options (the `opts` button in the popup), paste the token,
hit **save**, then **test** — it should report how many lists it can see.

The token sits in `chrome.storage.local`, so anyone with your Chrome profile can
read it. That is why it is scoped to one repo and one permission: the worst case
is someone editing this site's files.

## Using it

**Toolbar icon** — opens the popup with the current tab's title and URL already
filled in. Pick a list, add a note if you want, save. The popup closes itself.

**Right-click** — _add to library → \<list\>_ on any page or link, no popup. A
selection becomes the note on a page, or the title on a link. The submenu is
built from the cached lists; _refresh lists_ re-reads them from GitHub.

**Manage tab** — create, rename, and delete lists; edit and delete entries.
Delete asks twice: the button turns into `sure?` before it does anything.

**Drag an entry onto another list** to move it there. A collapsed list is a
target too, so you do not have to open it first; the one it already lives in is
not, and will not light up. It lands at the top and that list opens so you can
see it. Moving keeps the entry's id, so its screenshot stays where it is rather
than being rewritten under a new name. There is no reordering within a list —
only moving between them.

## The popup is a fixed size

A popup is bounded by the browser window, not only by chrome's 800px, which on
a laptop works out around 600. Sizing it from its content therefore meant
guessing, and guessing wrong cut the buttons off the bottom. It is 34rem tall
instead: the form scrolls and the buttons are pinned under it, so nothing is
ever unreachable whatever the screen. Save is pinned too, and hides on the
manage tab where it has nothing to do.

## Admin view

When the tab you are on *is* the site, the popup also offers **edit this page**
above that, which opens the admin view already on whatever you were reading —
straight into a dump's editor rather than its list. It only appears when the
path is something the admin view can actually edit, so not on home, not on
/arch, and not on another site. `site-paths.js` holds that mapping, shared so
the popup and the admin view cannot disagree about it.

The popup's **edit website** button opens a stand-in for the site you can type
into: the same card over the same green field, the same nav, the same
markdown rendering, with about, now, runs and blog editable in place. The
card takes the size the site gives each tab — home the small corner card,
about/now/runs the tall one, blog and library the full width. Type over
the text, hit save (or cmd-S), and it commits to `content/` — same conditional
ref update as everything else here, so a change that landed elsewhere is a
conflict rather than an overwrite.

Home is listed but not editable. It is a few lines of jsx and a spotify widget
over the map — components, not prose, with nothing to type over.

### The page's `# title` is not on the site

The site drops a page's h1: the card's heading already names the tab, and a post takes
its title from the front matter. The line is still in the file, so the editor
keeps it editable, but faded, struck through and labelled *not shown on the
site* so nobody polishes a line no visitor will read.

### Private dumps

Ticking **private** puts `private: true` in the front matter. The site then
leaves that dump off the index *and builds no page for it at all*, so its url
404s rather than being an unlisted page someone could stumble onto. Unticking
it removes the key rather than writing `private: false`.

**It is off the site, not secret.** This repo is public, so the markdown is
still there for anyone who looks at github. The editor says so under the
checkbox. If a dump needs to be genuinely unreadable it cannot live here at
all — it would need a private repo, which is a different `owner`/`repo` in
options and a second token.

The live link is disabled while a dump is private, because there is no page to
open.

### Seeing it live

**live ↗** in the titlebar opens whatever you are editing on the real site, in
a new tab — `/about`, `/library`, `/blog/<slug>`, and so on. It is an anchor
rather than a button so the url is there to copy or middle-click.

For a write-up it points at the *saved* slug, not the one sitting in the field.
A slug you have typed but not committed is a url that does not exist yet, and
the link would 404; the filename preview under the field is where you see the
pending one. After a rename it follows to the new url.

The site it points at is the **site url** in options, which defaults to
isaacchacko.com.

### The library page, from the admin view

The **library** tab is the popup's manage view with room to breathe, laid out as
the site lays it out: every list open at once, each entry a bullet, a favicon
and its label, and hovering one slides its screenshot and note into the drawer
on the right. Moving an entry between lists is a drag rather than a trip
through a submenu. The **ed** and **del** buttons show when you point at a row. Lists and entries
can both be added, edited and deleted, delete asks twice, and deleting an entry
takes its screenshot with it — the same helpers the popup uses, so the conflict
handling and the cleanup come along unchanged.

Every action is its own commit, as in the popup. Save and revert are hidden on
this tab because there is nothing held back.

One thing the popup can do that this cannot: **capture a screenshot**. That
needs a tab showing the page, so an entry added from here has no image until
you re-save it from the popup on the page itself; the drawer says so. Thumbnails
are loaded from the live site, so a brand new one stays blank until that commit
has deployed.

### Dumps are files, so the admin view CRUDs them

The page is called **blog** and lives at `/blog`; the old `/dumps` and
`/learnings` urls redirect there. A single post is still a dump in the code,
and the content directory stays `content/dumps`.

The **blog** tab lists every dump the way the site's index does — title,
month and description, newest first — with a **del** next to it and a
**+ new post** button underneath. A private one is tagged. A missing
description shows as *no description*, because the site's index shows an empty
line there. Delete asks twice, the same as everywhere else here.

Opening one shows the post's header as the site draws it: **← blog**, the
date and read time (kept current as you type), then the title and description
as inputs dressed as the real thing, because those are what the site reads,
not the body. The date, slug and private flag sit under **front matter**,
folded away. The **url
slug** is the filename. Changing it renames the file, which lands as the new
path and the old one's removal in a *single* commit, so the write-up is never
briefly missing or briefly duplicated. It also breaks any existing link, and
the editor says so rather than letting you find out later.

The slug field takes whatever you type, spaces and all, because normalising
every keystroke makes it impossible to type — a trailing space would be
stripped before you reached the next word. It is tidied when you leave the
field, and the filename it will actually become is shown underneath the whole
time, so the field never quietly disagrees with what gets committed. Accents
decompose to their base letter, so "café" is `cafe` rather than `caf`.

A new dump starts as a real file with front matter and a first line, so the
index page, the editor and a later save all see the same shape as any other.
It gets no `# title` in the body — the site would only drop it.
Its slug follows the title while you are naming it, and stops the moment you
edit the slug yourself.

**revert** sits next to save and throws away everything unsaved — prose and
front matter both — back to what was last loaded or saved. It touches nothing
in the repo.

### Bullets and section labels are drawn, not typed

The bullet is a small ink square drawn by CSS `::before` and a `## heading` is
a small-caps label with a rule above it, the same as on the site, so there is
no marker character to select or backspace over. That makes a
bullet a one-way door unless the editor does something about it:

- **backspace at the very start of a line** turns a bullet or heading back into
  plain text. A bullet in the middle of a list leaves the items either side in
  lists of their own.
- **type `- ` or `## ` at the start of a line** to make one. A line turned into
  a bullet next to an existing list joins that list rather than starting a
  second one touching it.
- **enter on an empty bullet** leaves the list, and **enter at the end of a
  heading** starts a paragraph rather than another heading.

The two directions are exact inverses: adding a bullet and removing it again
returns the document to the structure it started with.

### Why editing the rendered page is safe

Saving rewrites the whole file from the DOM, so anything the serialiser cannot
read would be dropped silently. Three things stop that:

- **Both halves know the same constructs.** `markdown.js` renders and
  serialises headings, paragraphs, unordered lists, fenced code, and inline
  links, bold, italic and code — nothing else.
- **A file that cannot round-trip is never opened for editing.** On load the
  editor renders the markdown, serialises it straight back, and compares. If it
  does not match byte for byte the page goes read-only and says so, rather than
  letting you type into something it would mangle.
- **Paste is forced to plain text**, so rich markup never enters the document.

`markdown.test.html` asserts both properties — that render-then-serialise is
the identity for every file in `content/`, and that serialising twice after a
real contenteditable edit does not drift. Run it from the repo root:

```sh
python3 -m http.server 8000
open http://localhost:8000/extension/markdown.test.html
```

Headings keep their real level in the editor (`#` stays `<h1>`) even though the
site drops the `h1` altogether, so the trip back never loses it.

## It wears what the site wears

The site has one palette now — a pale card over a green field — and
`popup.css` copies its tokens (`--field`, `--paper`, `--ink`, `--rule`,
`--muted`, `--code`, `--tile`, `--accent`) from `src/app/globals.css`. Change
one and change the other; nothing enforces it. `--danger` is the extension's
own name and borrows the site's one warm colour, the terracotta `--accent`.
The font is the site's JetBrains Mono, from Google Fonts, falling back to the
system mono offline.

## Label

A page's own title is often not what you'd call it — `Lucas Jin — Software
Engineer, Designer, Etc.` when you just mean `lucas`. **Label** is optional and
is what the link reads as; the title stays on the entry as the record of what
the page actually calls itself.

Leave it blank and the link reads as the title, which is the usual case. Both
the popup and the manage view have the field, so you can add one later. The
manage list shows the label when there is one, so a row reads the way the site
does.

## Notes take markdown

A note — and a list's description — is rendered as inline markdown, so
`found via [lucas](https://lucasjin.ca)` gets you a real link with your own
text. `**bold**`, `*italic*` and `` `code` `` work too. Raw HTML does not, and
`javascript:` urls are stripped, so a note cannot do anything but read.

Block-level markdown (headings, lists) has nowhere to go on a single line —
keep notes inline.

## Private entries

Tick **private** when adding or editing an entry and it disappears from the
public page. Clicking the **library** heading on the site turns it into a
password field; the right password shows the private entries in place, with a
terracotta bullet. That only lasts until a reload.

The repo is public, so a private entry cannot just be flagged in `cool.json`.
It is encrypted (PBKDF2-SHA256 → AES-GCM) with the **library password** from
options and committed to `content/cool-private.json`, which holds only
ciphertext. The site's `/api/library/private` route opens that file with the
password the visitor typed. The site keeps no copy of the password: either
the typed one decrypts the file or it doesn't.

- **Pick a long password.** Anyone can download the encrypted file and try
  guesses offline, so rate limiting the route would not protect it.
- **Change it in options**, not anywhere else. Saving a new one re-encrypts the
  file under it in one commit, while the old one is still there to open it.
- **No password set:** you can still edit public entries, the private file is
  left as it is, and adding a private entry refuses. **Wrong password:**
  nothing loads, so a save cannot quietly wipe the entries it failed to open.
- **No screenshots.** `public/cool-shots` is public, so a private entry never
  captures one, and making an entry private deletes its existing screenshot. The
  edit form warns you as soon as you tick the box.
- In the extension a private entry sits among the others, tagged `private`, and
  every list helper treats it the same. It is pulled out on the way to github
  and slotted back in by position when read.

## Screenshots

Saving a page also grabs its visible viewport, shrinks it to 640px webp
(~30–50kb) and commits it to `public/cool-shots/<id>.webp`. The site shows it as
the drawer that slides in when you hover the entry. Deleting an entry deletes its shot.

Two cases get no screenshot, and both save fine without one:

- **Right-clicking a link.** Only the tab in front of us can be captured, and
  the linked page is not open.
- **Pages Chrome refuses to capture** — `chrome://`, the web store, the pdf
  viewer. The popup says so and greys the checkbox out.

Uncheck **screenshot** in the popup to skip it for a single save.

The thumbnail's slot is reserved in css rather than left to the image, since
capture is async and chrome measures a popup once, at first paint.

## How a save works

Read the branch head, read `cool.json` at that commit, apply the change, then
build one commit — json and screenshot together — on top of that head and
update the ref without forcing. Github rejects a non-fast-forward, so a commit
that landed since we read is a conflict rather than a silent overwrite; the
extension re-reads and reapplies once.

One commit per save matters for more than tidiness: two would mean two Vercel
builds, and a window where an entry points at a screenshot that is not there.

Those reads are sent with `cache: "no-store"`. Github answers the branch head
with `Cache-Control: private, max-age=60`, and a cached head is poison here: the
commit gets built on a parent that is no longer the tip, github rejects it, and
retrying re-reads the same stale answer. Saving twice inside a minute — delete
something, then add it back — is enough to hit it.

So `cool.json changed while saving` should now mean what it says: something
really did commit underneath you. Try again.

## Files

| file                  | what it does                                              |
| --------------------- | --------------------------------------------------------- |
| `store.js`            | GitHub client, the read-modify-write commit, list helpers, private-entry encryption |
| `background.js`       | context menus and their handler                            |
| `popup.js`            | the add form and the manage view                           |
| `admin.js`            | the editable stand-in for the site                         |
| `admin-cool.js`       | the library page's lists, entries and drawer, editable       |
| `site-paths.js`       | which admin page edits which url on the site               |
| `markdown.js`         | markdown in, DOM out, and back again                       |
| `shot.js`             | screenshot capture and shrinking                           |
| `options.js`          | repo + token settings                                      |
| `store.test.mjs`      | `npm test` — the commit logic, against a fake github       |
| `markdown.test.html`  | the round trip, in a browser because it needs a DOM        |
