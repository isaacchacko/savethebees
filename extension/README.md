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

| file            | what it does                                             |
| --------------- | -------------------------------------------------------- |
| `store.js`      | GitHub client, the read-modify-write commit, list helpers |
| `background.js` | context menus and their handler                           |
| `popup.js`      | the add form and the manage view                          |
| `options.js`    | repo + token settings                                     |
