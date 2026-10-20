# Verification — 0.1.1

- 29 automated checks passed for backup, restore, failure recovery, version compatibility, local patch generation and updater control flow.
- The authored local generator was tested privately against the supplied game files. Its decoded NPK resources match the earlier test payload: 318 building material changes and two Direct3D pixel shader changes. Only the storage compression differs.
- Generated Bubble Wrap, switched to Mobile and restored copies of the actual game files. All restored SHA-256 hashes matched their pre-apply bytes.
- Mobile rendering edits preserve unrelated config values and are stable when applied to the supplied already-mobile config.
- App interface smoke checks passed for folder selection, presets, Apply, Restore, update settings and fixed-window layout.

The Windows release workflow runs tests before building. Game acceptance, Direct3D shader compilation by the game, and the in-game appearance still need a Windows game test. The app has no anticheat bypass or runtime injection.
