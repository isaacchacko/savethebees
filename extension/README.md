# cool — the Chrome extension

CRUD for the lists on [/cool](https://isaacchacko.com/cool), from the browser.

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

**Right-click** — _add to cool → \<list\>_ on any page or link, no popup. A
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

## Admin view

When the tab you are on *is* the site, the popup also offers **edit this page**
above that, which opens the admin view already on whatever you were reading —
straight into a dump's editor rather than its list. It only appears when the
path is something the admin view can actually edit, so not on home, not on
/arch, and not on another site. `site-paths.js` holds that mapping, shared so
the popup and the admin view cannot disagree about it.

The popup's **edit website** button opens a stand-in for the site you can type
into: the same shell, the same palette, the same markdown rendering, with
about, now, running and the dumps editable in place. Type over
the text, hit save (or cmd-S), and it commits to `content/` — same conditional
ref update as everything else here, so a change that landed elsewhere is a
conflict rather than an overwrite.

Home is listed but not editable. It is a boid simulation, a spotify widget and
live readme embeds — components, not prose, with nothing to type over.

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
a new tab — `/about`, `/cool`, `/dumps/<slug>`, and so on. It is an anchor
rather than a button so the url is there to copy or middle-click.

For a write-up it points at the *saved* slug, not the one sitting in the field.
A slug you have typed but not committed is a url that does not exist yet, and
the link would 404; the filename preview under the field is where you see the
pending one. After a rename it follows to the new url.

The site it points at is the **site url** in options, which defaults to
isaacchacko.com.

### The cool page, from the admin view

The **cool** tab is the popup's manage view with room to breathe: every list is
open at once, entries show their screenshot, url and note, and moving one
between lists is a drag rather than a trip through a submenu. Lists and entries
can both be added, edited and deleted, delete asks twice, and deleting an entry
takes its screenshot with it — the same helpers the popup uses, so the conflict
handling and the cleanup come along unchanged.

Every action is its own commit, as in the popup. There is no save button here
because there is nothing held back.

One thing the popup can do that this cannot: **capture a screenshot**. That
needs a tab showing the page, so an entry added from here has no image until
you re-save it from the popup on the page itself. Thumbnails are loaded from
the live site, so a brand new one stays blank until that commit has deployed.

### Dumps are files, so the admin view CRUDs them

The page is called **yap**; a single write-up is a dump. The route and the
content directory stay `dumps`.

The **yap** tab lists every dump with a **del** next to it and a **+ new
write-up** button underneath. Delete asks twice, the same as everywhere else
here.

Opening one shows its front matter — title, date, description — above the
prose, because those are what the index page reads, not the body. The **url
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

A new dump starts as a real file with front matter and a heading, so the
index page, the editor and a later save all see the same shape as any other.
Its slug follows the title while you are naming it, and stops the moment you
edit the slug yourself.

**revert** sits next to save and throws away everything unsaved — prose and
front matter both — back to what was last loaded or saved. It touches nothing
in the repo.

### The ─ and ## are drawn, not typed

The bullet markers and heading hashes are CSS `::before`, the same as on the
site, so there is no character there to select or backspace over. That makes a
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
site maps markdown `h1` onto an `<h2>`. Rendering both as `<h2>` would make the
trip back ambiguous; `admin.css` makes them look the same instead.

## It wears whatever the site is wearing

The site picks its palette from the wall clock — `floor(now / 5min) % 5` over
pink, banana, dryft, maroon, matcha — rather than storing it, so every visitor
sees the same theme at the same moment. `themes.js` does that same arithmetic,
which is the whole synchronisation: no messaging, no network, nothing to fall
out of step. Open the popup and it is already on the site's current theme, and
it rolls over on the boundary if you leave it open.

The palettes in `popup.css` mirror `src/app/globals.css`. Change one and change
the other — nothing enforces it. `--danger` is the exception: the site has no
equivalent, so each palette picks its own.

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

## Screenshots

Saving a page also grabs its visible viewport, shrinks it to 640px webp
(~30–50kb) and commits it to `public/cool-shots/<id>.webp`. The site shows it as
a hover preview over the entry's title. Deleting an entry deletes its shot.

Two cases get no screenshot, and both save fine without one:

- **Right-clicking a link.** Only the tab in front of us can be captured, and
  the linked page is not open.
- **Pages Chrome refuses to capture** — `chrome://`, the web store, the pdf
  viewer. The popup says so and greys the checkbox out.

Uncheck **screenshot** in the popup to skip it for a single save.

The thumbnail's slot is reserved in css rather than left to the image. Chrome
measures a popup once, at first paint, and capture is async — an image with no
reserved size is 0px when that measurement happens and 9rem a moment later, so
the popup keeps the smaller size and the buttons end up below the fold.

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
| `store.js`            | GitHub client, the read-modify-write commit, list helpers |
| `background.js`       | context menus and their handler                            |
| `popup.js`            | the add form and the manage view                           |
| `admin.js`            | the editable stand-in for the site                         |
| `admin-cool.js`       | the cool page's lists and entries, editable                |
| `site-paths.js`       | which admin page edits which url on the site               |
| `markdown.js`         | markdown in, DOM out, and back again                       |
| `themes.js`           | the site's wall-clock palette rotation                     |
| `shot.js`             | screenshot capture and shrinking                           |
| `options.js`          | repo + token settings                                      |
| `store.test.mjs`      | `npm test` — the commit logic, against a fake github       |
| `markdown.test.html`  | the round trip, in a browser because it needs a DOM        |
