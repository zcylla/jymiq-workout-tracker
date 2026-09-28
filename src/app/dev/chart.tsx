import { ColumnChart, Screen, ScreenHeader, Section, TrendChart } from '@/components';
import { dailyWeights } from '@/lib/bodyweight';

/** Lab 37 D2's fourteen readings, ending today. */
const BW = [82.4, 82.9, 82.1, 82.6, 83.0, 82.7, 83.2, 83.4, 83.0, 83.6, 83.9, 83.5, 84.1, 84.3];

function boardDays() {
  const t = new Date();
  return dailyWeights(
    BW.map((weightKg, i) => ({
      measuredAt: new Date(t.getFullYear(), t.getMonth(), t.getDate() - 13 + i, 7).getTime(),
      weightKg,
    })),
  );
}

export default function ChartScreen() {
  return (
    <Screen>
      <ScreenHeader title="Column chart" kicker="DEV" />

      <Section first label="SESSIONS PER WEEK" plated={false}>
        <ColumnChart
          values={[6, 6, 2, 0, 0, 0, 0, 0]}
          xFirst="WK 1"
          xLast="WK 8"
          value="2 of 6"
          active={2}
          h={54}
        />
      </Section>

      <Section label="ESTIMATED 1RM · UP 18 KG" plated={false}>
        <ColumnChart
          values={[112, 116, 114, 119, 121, 124, 122, 126, 128, 130]}
          xFirst="10 AGO"
          xLast="TODAY"
        />
      </Section>

      <Section label="LAST 14 DAYS · KG" plated={false}>
        <TrendChart days={boardDays()} now={nowMs()} />
      </Section>
    </Screen>
  );
}

function nowMs(): number {
  return Date.now();
}
