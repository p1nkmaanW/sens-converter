# Sens Converter

Converts mouse sensitivity between 32 games by matching cm/360, and compares settings across a group of friends.

```bash
npm install
npm run app
npm test
npm run dist
```

`npm run app` opens the desktop app. `npm run dist` builds a portable Windows `.exe` in `release/`. It isn't code-signed, so Windows SmartScreen warns on first launch.

## How it works

Every game defines how many degrees the view turns per mouse count. The app turns your settings into cm/360 and solves for the sensitivity that gives the same distance in each game:

```
cm/360 = (360 × 2.54) / (DPI × degrees per count)
```

## How far to trust a value

Game values live in `src/games.ts`. None of them come from game developers.

- **Confirmed:** two or more independent converters agree.
- **One source:** only one converter was found.
- **Check in game:** sources disagree, or no source confirmed it. Test these before relying on them.

PUBG is left out because its slider is not linear and no source confirmed the formula. The app matches hipfire only, not ADS or scopes.

Friends are stored on this device. Group codes carry the whole group, including player names.
