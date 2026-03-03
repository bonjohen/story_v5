# Archetype Graph ID Naming Convention

All node and edge IDs across the 15 archetype graphs must follow this convention to ensure uniqueness, determinism, and readability.

## Archetype Prefixes

| # | Archetype | Prefix |
|---|-----------|--------|
| 1 | The Hero's Journey | `HJ` |
| 2 | Rags to Riches | `RR` |
| 3 | The Quest | `QU` |
| 4 | Voyage and Return | `VR` |
| 5 | Overcoming the Monster | `OM` |
| 6 | Rebirth | `RB` |
| 7 | Tragedy | `TR` |
| 8 | Comedy (Restoration of Order) | `CO` |
| 9 | Coming of Age | `CA` |
| 10 | The Revenge | `RV` |
| 11 | The Escape | `ES` |
| 12 | The Sacrifice | `SA` |
| 13 | The Mystery Unveiled | `MU` |
| 14 | The Transformation | `TF` |
| 15 | The Rise and Fall | `RF` |

## Node ID Format

```
{PREFIX}_N{##}_{SHORT_NAME}
```

- `{PREFIX}` — two-letter archetype code from the table above
- `N` — literal character indicating a node
- `{##}` — two-digit zero-padded sequence number (01, 02, ... 99)
- `{SHORT_NAME}` — uppercase snake_case descriptor (max 20 characters)

**Examples:**
- `HJ_N01_ORDINARY_WORLD`
- `HJ_N03_THRESHOLD`
- `TR_N06_DOWNFALL`

**Numbering rules:**
- Numbers reflect the canonical (most common) traversal order from start to terminal
- Variant-only nodes use numbers in the 50–79 range to keep them visually distinct
- Reserve 80–99 for future expansion

## Edge ID Format

```
{PREFIX}_E{##}_{SHORT_NAME}
```

- `{PREFIX}` — same two-letter archetype code
- `E` — literal character indicating an edge
- `{##}` — two-digit zero-padded sequence number
- `{SHORT_NAME}` — uppercase snake_case descriptor (max 20 characters)

**Examples:**
- `HJ_E01_CALL_RECEIVED`
- `HJ_E03_CROSSING`
- `TR_E07_FINAL_RECKONING`

**Numbering rules:**
- Edge numbers correspond to the order in which transitions occur along the canonical path
- Variant-only edges use numbers in the 50–79 range
- Reserve 80–99 for future expansion

## Constraints

- All IDs must be unique within the entire archetype corpus (guaranteed by the prefix system)
- IDs must not change once published; additions use the next available number
- Short names should be meaningful without consulting the full label (prefer `THRESHOLD` over `STEP3`)
