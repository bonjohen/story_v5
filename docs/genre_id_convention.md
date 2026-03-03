# Genre Depth Graph ID Naming Convention

## Node IDs

Format: `{PREFIX}_N{##}_{SHORT_NAME}`

- **PREFIX**: 2-letter genre abbreviation (see table below)
- **N**: literal character indicating a node
- **##**: two-digit number, assigned by level range (see below)
- **SHORT_NAME**: UPPER_SNAKE_CASE descriptive label

### Node Number Ranges by Level

| Range  | Level | Role              |
|--------|-------|-------------------|
| 01–09  | 1     | Genre Promise     |
| 10–19  | 2     | Core Constraint   |
| 20–39  | 3     | Subgenre Pattern  |
| 40–59  | 4     | Setting Rule      |
| 60–79  | 5     | Scene Obligation  |
| 80–89  | —     | Tone Marker       |
| 90–99  | —     | Anti-Pattern      |

### Examples

- `HR_N01_PROMISE` — Horror genre promise (Level 1)
- `HR_N10_THREAT_PRESENT` — Horror core constraint (Level 2)
- `HR_N20_SLASHER` — Horror subgenre (Level 3)
- `HR_N40_ISOLATION` — Horror setting rule (Level 4)
- `HR_N60_FIRST_SCARE` — Horror scene obligation (Level 5)
- `HR_N80_DREAD_ATMOSPHERE` — Horror tone marker
- `HR_N90_CONSEQUENCE_FREE` — Horror anti-pattern

## Edge IDs

Format: `{PREFIX}_E{##}_{SHORT_NAME}`

- **PREFIX**: same 2-letter genre abbreviation
- **E**: literal character indicating an edge
- **##**: two-digit number, assigned by transition range (see below)
- **SHORT_NAME**: UPPER_SNAKE_CASE descriptive label

### Edge Number Ranges by Transition

| Range  | Typical Transition |
|--------|--------------------|
| 01–09  | Level 1 → Level 2  |
| 10–29  | Level 2 → Level 3  |
| 30–49  | Level 3 → Level 4  |
| 50–69  | Level 4 → Level 5  |
| 70–89  | Cross-level or supplementary |
| 90–99  | Anti-pattern edges  |

### Examples

- `HR_E01_FEAR_REQUIRES_THREAT` — Promise → Core Constraint
- `HR_E10_THREAT_BRANCHES_SLASHER` — Core Constraint → Subgenre
- `HR_E30_SLASHER_ISOLATION` — Subgenre → Setting Rule
- `HR_E50_ISOLATION_FIRST_SCARE` — Setting Rule → Scene Obligation

## Genre Prefix Table

| # | Genre                | Prefix |
|---|----------------------|--------|
| 1 | Drama                | DR     |
| 2 | Action               | AC     |
| 3 | Comedy               | CM     |
| 4 | Thriller             | TH     |
| 5 | Fantasy              | FN     |
| 6 | Science Fiction      | SF     |
| 7 | Adventure            | AV     |
| 8 | Romance              | RO     |
| 9 | Romantic Comedy      | RC     |
| 10| Horror               | HR     |
| 11| Mystery              | MY     |
| 12| Crime                | CR     |
| 13| Detective            | DT     |
| 14| Superhero            | SH     |
| 15| Historical           | HI     |
| 16| War                  | WR     |
| 17| Biography            | BI     |
| 18| Family               | FA     |
| 19| Young Adult          | YA     |
| 20| Literary Fiction     | LF     |
| 21| Children's Literature| CL     |
| 22| Satire               | SA     |
| 23| Psychological        | PS     |
| 24| Western              | WE     |
| 25| Political            | PL     |
| 26| Musical              | MU     |
| 27| Holiday              | HL     |

## Controlled Vocabulary Reference

- **Edge meanings**: `docs/genre_edge_vocabulary.json` (12 terms)
- **Node roles**: `docs/genre_node_roles.json` (7 roles: 5 spine levels + 2 structural)
