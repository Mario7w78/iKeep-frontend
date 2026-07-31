import { DayOfWeek } from '../../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK, DAYOFWEEK_TO_JS_DAY, dayOfWeekToExpoWeekday } from '../scheduleUtils';

describe('dayOfWeekToExpoWeekday', () => {
  const cases: [DayOfWeek, number][] = [
    ['Domingo', 1],
    ['Lunes', 2],
    ['Martes', 3],
    ['Miercoles', 4],
    ['Jueves', 5],
    ['Viernes', 6],
    ['Sabado', 7],
  ];

  it.each(cases)('maps %s to Expo weekday %i', (day, expected) => {
    expect(dayOfWeekToExpoWeekday(day)).toBe(expected);
  });

  it('round-trips with JS_DAY_TO_DAYOFWEEK', () => {
    for (const [jsDay, day] of Object.entries(JS_DAY_TO_DAYOFWEEK)) {
      expect(DAYOFWEEK_TO_JS_DAY[day]).toBe(Number(jsDay));
      expect(dayOfWeekToExpoWeekday(day)).toBe(Number(jsDay) + 1);
    }
  });
});
