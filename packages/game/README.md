# Game configuration

`GameConfiguration` is the serializable contract for board generation and gameplay.
Normal, daily, and practice factories provide presets; difficulty supplies the normal
board size, time limit, and letter weights. Daily seeds retain the historical `v1`
prefix. Practice can reuse any preset and its seed with ranking disabled.

```ts
const config: GameConfiguration = {
  ...createNormalGameConfiguration("easy"),
  mode: "sprint",
  durationSeconds: 30,
  seed: { kind: "fixed", value: "sprint-1" },
  modifiers: [
    {
      id: "double-points",
      rules: { scoring: { ...STANDARD_SCORING, multiplier: 2 } },
    },
  ],
};
const board = generateConfiguredBoard(config);
// <PlayGame config={config} cells={board.cells} targetWords={board.targetWords} />
```

Modifiers override `GameRules` in order, with the last override winning. Nested
rules (such as scoring) are replaced as a whole. Resolution validates and returns
a flattened configuration without changing the input. Add future engine behavior
as a typed rule consumed in the shared engine, then enable it through presets or
modifiers. The engine does not switch on `mode`.

`ranked` expresses eligibility; the daily feature still enforces its first-attempt
policy. It is not proof of eligibility for server authorization. Zero seconds ends
a game immediately. `endOnAllWordsFound` controls early completion. Scoring uses
the highest matching minimum-length tier, multiplied by the configured multiplier.

Saved normal games include their resolved configuration, so restoration uses the
original scoring and board rules. Legacy sessions without configuration use their
original difficulty preset.
