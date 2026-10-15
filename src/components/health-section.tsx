import { Section } from './section';
import { StatTiles, type Tile } from './tiles';

export function HealthSection({
  avgHr,
  maxHr,
  first,
}: {
  avgHr: number | null;
  maxHr: number | null;
  first?: boolean;
}) {
  const healthTiles: Tile[] = [];
  if (avgHr != null && maxHr != null) {
    healthTiles.push(
      { label: 'AVG HEART RATE', value: `${avgHr} BPM` },
      { label: 'MAX HEART RATE', value: `${maxHr} BPM` },
    );
  }

  if (healthTiles.length === 0) return null;

  return (
    <Section label="HEALTH" pad={13} first={first}>
      <StatTiles items={healthTiles} columns={healthTiles.length} surface="raised" />
    </Section>
  );
}
