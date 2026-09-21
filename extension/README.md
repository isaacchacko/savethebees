# cool — the Chrome extension

CRUD for the lists on [/cool](https://isaacchacko.co/cool), from the browser.

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

## How a save works

Read `cool.json` with its blob SHA, apply the change, `PUT` it back with that
SHA. GitHub rejects the write if the file moved underneath us, in which case the
extension re-reads and reapplies once. That keeps two quick saves — or a save
racing a hand edit — from silently clobbering each other.

## Files

| file            | what it does                                             |
| --------------- | -------------------------------------------------------- |
| `store.js`      | GitHub client, the read-modify-write commit, list helpers |
| `background.js` | context menus and their handler                           |
| `popup.js`      | the add form and the manage view                          |
| `options.js`    | repo + token settings                                     |
