import { ColumnChart, Screen, ScreenHeader, Section } from '@/components';

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
    </Screen>
  );
}
