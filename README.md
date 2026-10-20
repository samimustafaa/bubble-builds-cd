# Bubble Builds — sg0hann

Experimental build appearance presets for Creative Destruction, with Apply and Restore Backup.

[Download the Windows app](https://github.com/samimustafaa/bubble-builds-cd/releases/latest)

Close the game and launcher, choose the game folder, select **Bubble Wrap — Test 01** or **Mobile / flat**, and click **Apply preset**. **Restore backup** returns the exact files saved before the first Apply, including graphics changes you already had.

The app generates patches locally from the installed game files. The repository and releases contain app code and rendering instructions, with no game archives. Supported archives are the supplied June 2020 `model_regular.npk` and `shader.npk`; other versions are rejected.

Updates are connected to this repository. The app checks at startup and every 30 minutes. Click **Update & restart** to download, verify, install and reopen automatically. Backups and settings remain in place. Users of v0.1.0 can enter `samimustafaa/bubble-builds-cd` in Updates once, then update.

The visual effect is experimental and needs in-game testing. Existing build geometry and animations remain. See [verification notes](VERIFICATION.md).

## Development

```sh
npm ci
npm test
npm start
npm run build:win
```

Increase `version` in package.json and package-lock.json, then push to `main` to build and publish the next Windows release. Building does not need game files, Node native addons, or Python.
