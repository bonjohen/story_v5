import { useCallback } from 'react'
import { ARCHETYPE_DIRS, GENRE_DIRS } from '../graph-engine/dataIndex.ts'

interface GraphSelectorProps {
  currentId: string | null
  onSelect: (type: 'archetype' | 'genre', dir: string) => void
}

const ARCHETYPE_LABELS: Record<string, string> = {
  '01_heros_journey': "Hero's Journey",
  '02_rags_to_riches': 'Rags to Riches',
  '03_the_quest': 'The Quest',
  '04_voyage_and_return': 'Voyage and Return',
  '05_overcoming_the_monster': 'Overcoming the Monster',
  '06_rebirth': 'Rebirth',
  '07_tragedy': 'Tragedy',
  '08_comedy': 'Comedy',
  '09_coming_of_age': 'Coming of Age',
  '10_the_revenge': 'The Revenge',
  '11_the_escape': 'The Escape',
  '12_the_sacrifice': 'The Sacrifice',
  '13_the_mystery_unveiled': 'The Mystery Unveiled',
  '14_the_transformation': 'The Transformation',
  '15_the_rise_and_fall': 'The Rise and Fall',
}

const GENRE_LABELS: Record<string, string> = {
  '01_drama': 'Drama',
  '02_action': 'Action',
  '03_comedy': 'Comedy',
  '04_thriller': 'Thriller',
  '05_fantasy': 'Fantasy',
  '06_science_fiction': 'Science Fiction',
  '07_adventure': 'Adventure',
  '08_romance': 'Romance',
  '09_romantic_comedy': 'Romantic Comedy',
  '10_horror': 'Horror',
  '11_mystery': 'Mystery',
  '12_crime': 'Crime',
  '13_detective': 'Detective',
  '14_superhero': 'Superhero',
  '15_historical': 'Historical',
  '16_war': 'War',
  '17_biography': 'Biography',
  '18_family': 'Family',
  '19_young_adult': 'Young Adult',
  '20_literary_fiction': 'Literary Fiction',
  '21_childrens_literature': "Children's Literature",
  '22_satire': 'Satire',
  '23_psychological': 'Psychological',
  '24_western': 'Western',
  '25_political': 'Political',
  '26_musical': 'Musical',
  '27_holiday': 'Holiday',
}

export function GraphSelector({ currentId, onSelect }: GraphSelectorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      if (!value) return
      const [type, dir] = value.split('::') as ['archetype' | 'genre', string]
      onSelect(type, dir)
    },
    [onSelect],
  )

  const currentValue = currentId ?? ''

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <select
        value={currentValue}
        onChange={handleChange}
        aria-label="Select a graph"
        style={{ minWidth: 240 }}
      >
        <option value="">Select a graph...</option>
        <optgroup label="Archetypes (15)">
          {ARCHETYPE_DIRS.map((dir) => (
            <option key={dir} value={`archetype::${dir}`}>
              {ARCHETYPE_LABELS[dir] ?? dir}
            </option>
          ))}
        </optgroup>
        <optgroup label="Genres (27)">
          {GENRE_DIRS.map((dir) => (
            <option key={dir} value={`genre::${dir}`}>
              {GENRE_LABELS[dir] ?? dir}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
