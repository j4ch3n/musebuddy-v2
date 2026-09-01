import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { StyleSheet, Text, View } from 'react-native';

import { StreakProgressRing } from '@/components/streak-progress-ring';
import { isStreakDayComplete, streakFixture } from '@/constants/home-screen-mock';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { TactileControlAction } from '@/ui/tactile-control';

export function StreakView({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <View style={styles.header}>
        <Text style={styles.title}>{expanded ? 'This month' : 'This week'}</Text>
        <TactileControlAction
          accessibilityLabel={expanded ? 'Collapse streak calendar' : 'Expand streak calendar'}
          accessibilityState={{ expanded }}
          onPress={onToggle}
          pressedStyle={styles.chevronPressed}
          style={styles.chevronButton}
        >
          <MaterialIcons
            color={museBuddyColors.pine}
            name={expanded ? 'expand-less' : 'expand-more'}
            size={31}
          />
        </TactileControlAction>
      </View>
      {expanded ? <ExpandedCalendar /> : <CompactStreak />}
    </View>
  );
}

function CompactStreak() {
  return (
    <View style={styles.compactContent}>
      <View style={styles.compactDays}>
        {streakFixture.days.map((day, index) => (
          <View key={`${day.dayLabel}-${index}`} style={styles.compactDay}>
            <Text style={[styles.dayLabel, day.status === 'current' && styles.currentDayLabel]}>
              {day.dayLabel}
            </Text>
            <View style={[styles.starDot, day.status === 'upcoming' && styles.starDotUpcoming]}>
              {day.status !== 'upcoming' ? (
                <FontAwesome5
                  color={museBuddyColors.mist}
                  iconStyle="solid"
                  name={isStreakDayComplete(day) ? 'star' : 'star-half-alt'}
                  size={13}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.count}>
        <FontAwesome5 color={museBuddyColors.wildflower} iconStyle="solid" name="fire" size={29} />
        <Text style={styles.countLabel}>{streakFixture.currentCount}</Text>
      </View>
    </View>
  );
}

function ExpandedCalendar() {
  return (
    <View style={styles.calendar}>
      <View style={styles.calendarWeekdays}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLabel, index) => (
          <Text key={`${dayLabel}-${index}`} style={styles.calendarWeekdayLabel}>
            {dayLabel}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {Array.from({ length: streakFixture.month.leadingEmptyDays }, (_, index) => (
          <View key={`empty-${index}`} style={styles.calendarEmptyDay} />
        ))}
        {streakFixture.month.days.map((day) => (
          <View key={day.dayOfMonth} style={styles.calendarDay}>
            <Text style={[styles.dayLabel, day.status === 'current' && styles.currentDayLabel]}>
              {day.dayOfMonth}
            </Text>
            <StreakProgressRing
              accessibilityLabel={`Day ${day.dayOfMonth}`}
              completedSegments={day.progress}
              showCenterIcon={day.status !== 'upcoming'}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { gap: 10, paddingTop: 10 },
  calendarDay: { alignItems: 'center', gap: 5, paddingVertical: 3, width: '14.285714%' },
  calendarEmptyDay: { width: '14.285714%' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekdayLabel: {
    color: museBuddyColors.pine,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    width: '14.285714%',
  },
  calendarWeekdays: { flexDirection: 'row' },
  card: {
    backgroundColor: museBuddyColors.sunWash,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 7px 0 ${museBuddyColors.sky}`,
    gap: 9,
    padding: 16,
  },
  cardExpanded: { gap: 14, paddingBottom: 20 },
  chevronButton: {
    alignItems: 'center',
    borderRadius: museBuddyRadii.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  chevronPressed: { backgroundColor: museBuddyColors.leafWash, transform: [{ translateY: 2 }] },
  compactContent: { alignItems: 'flex-end', flexDirection: 'row', gap: 14 },
  compactDay: { alignItems: 'center', gap: 7 },
  compactDays: { flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'space-between' },
  count: {
    alignItems: 'center',
    borderLeftColor: museBuddyColors.pine,
    borderLeftWidth: 2,
    flexDirection: 'row',
    gap: 5,
    paddingLeft: 12,
  },
  countLabel: { color: museBuddyColors.pine, fontSize: 29, fontWeight: '900', lineHeight: 34 },
  currentDayLabel: { color: museBuddyColors.wildflower },
  dayLabel: { color: museBuddyColors.pine, fontSize: 13, fontWeight: '900', lineHeight: 16 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  starDot: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.round,
    height: 27,
    justifyContent: 'center',
    width: 27,
  },
  starDotUpcoming: {
    backgroundColor: 'transparent',
    borderColor: museBuddyColors.leaf,
    borderWidth: 3,
  },
  title: {
    color: museBuddyColors.pine,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
    textTransform: 'uppercase',
  },
});
