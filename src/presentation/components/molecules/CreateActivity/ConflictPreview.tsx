import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OverlapConflictData } from '../../../../domain/errors/OverlapError';
import { hhmmToMinutes, formatHour } from '../../../utils/scheduleUtils';

/* ───────── Constants ───────── */

const MINI_HOUR_HEIGHT = 28;
const LABEL_WIDTH = 44;
const BAR_LEFT = LABEL_WIDTH + 4;
const BAR_RIGHT = 4;
const WINDOW_PADDING_MINUTES = 90; // ±1.5h

const EXISTING_BAR_BG = '#2A2D3A';
const EXISTING_BAR_BORDER = '#5A6A7A';
const EXISTING_BAR_TEXT = '#8A9AAA';
const PROPOSED_BAR_BG = 'rgba(255, 107, 107, 0.25)';
const PROPOSED_BAR_BORDER = '#FF6B6B';
const PROPOSED_BAR_TEXT = '#FF6B6B';
const OVERLAY_BG = 'rgba(255, 107, 107, 0.20)';
const CONTAINER_BG = '#1E2028';

/* ───────── Helpers ───────── */

function computeOverlap(
  existingStart: string,
  existingEnd: string,
  proposedStart: string,
  proposedEnd: string,
): { startMinutes: number; endMinutes: number } | null {
  const es = hhmmToMinutes(existingStart);
  const ee = hhmmToMinutes(existingEnd);
  const ps = hhmmToMinutes(proposedStart);
  const pe = hhmmToMinutes(proposedEnd);

  const overlapStart = Math.max(es, ps);
  const overlapEnd = Math.min(ee, pe);

  if (overlapStart >= overlapEnd) return null;
  return { startMinutes: overlapStart, endMinutes: overlapEnd };
}

function clampToDay(minutes: number): number {
  return Math.max(0, Math.min(1440, minutes));
}

/* ───────── Props ───────── */

interface ConflictPreviewProps {
  conflicts: OverlapConflictData[];
}

/* ───────── Component ───────── */

export const ConflictPreview: React.FC<ConflictPreviewProps> = ({ conflicts }) => {
  const { windowStart, windowEnd, containerHeight } = useMemo(() => {
    if (conflicts.length === 0) {
      return { windowStart: 0, windowEnd: 120, containerHeight: 120 };
    }

    let minMin = Infinity;
    let maxMin = -Infinity;

    for (const c of conflicts) {
      const es = hhmmToMinutes(c.conflictingActivity.startTime);
      const ee = hhmmToMinutes(c.conflictingActivity.endTime);
      const ps = hhmmToMinutes(c.proposedTime.startTime);
      const pe = hhmmToMinutes(c.proposedTime.endTime);
      minMin = Math.min(minMin, es, ps);
      maxMin = Math.max(maxMin, ee, pe);
    }

    // Expand ±1.5h and cap to 00:00–24:00
    const winStart = clampToDay(minMin - WINDOW_PADDING_MINUTES);
    const winEnd = clampToDay(maxMin + WINDOW_PADDING_MINUTES);

    // Round window start to previous full hour for clean labels
    const roundedStart = Math.floor(winStart / 60) * 60;
    const roundedEnd = Math.ceil(winEnd / 60) * 60;

    const height = Math.max(
      ((roundedEnd - roundedStart) / 60) * MINI_HOUR_HEIGHT,
      80, // minimum ~3h
    );

    return {
      windowStart: roundedStart,
      windowEnd: roundedEnd,
      containerHeight: height,
    };
  }, [conflicts]);

  // Generate hour labels
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = windowStart / 60; h <= windowEnd / 60; h++) {
      list.push(h);
    }
    return list;
  }, [windowStart, windowEnd]);

  // Compute bar positions
  const bars = useMemo(() => {
    return conflicts.map((c) => {
      const es = hhmmToMinutes(c.conflictingActivity.startTime);
      const ee = hhmmToMinutes(c.conflictingActivity.endTime);
      const ps = hhmmToMinutes(c.proposedTime.startTime);
      const pe = hhmmToMinutes(c.proposedTime.endTime);

      // Existing bar
      const existingTop = ((es - windowStart) / 60) * MINI_HOUR_HEIGHT;
      const existingHeight = Math.max(((ee - es) / 60) * MINI_HOUR_HEIGHT - 2, 14);

      // Proposed bar
      const proposedTop = ((ps - windowStart) / 60) * MINI_HOUR_HEIGHT;
      const proposedHeight = Math.max(((pe - ps) / 60) * MINI_HOUR_HEIGHT - 2, 14);

      // Overlap zone
      const overlap = computeOverlap(
        c.conflictingActivity.startTime,
        c.conflictingActivity.endTime,
        c.proposedTime.startTime,
        c.proposedTime.endTime,
      );
      let overlayTop = 0;
      let overlayHeight = 0;
      if (overlap) {
        overlayTop = ((overlap.startMinutes - windowStart) / 60) * MINI_HOUR_HEIGHT;
        overlayHeight = Math.max(
          ((overlap.endMinutes - overlap.startMinutes) / 60) * MINI_HOUR_HEIGHT,
          14,
        );
      }

      return {
        key: `${c.conflictingActivity.id}-${c.proposedTime.startTime}`,
        title: c.conflictingActivity.title,
        existingTop,
        existingHeight,
        proposedTop,
        proposedHeight,
        overlayTop,
        overlayHeight,
      };
    });
  }, [conflicts, windowStart]);

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {/* Hour labels */}
      {hours.map((h) => (
        <View
          key={`hour-${h}`}
          style={[
            styles.hourRow,
            { top: ((h * 60 - windowStart) / 60) * MINI_HOUR_HEIGHT },
          ]}
        >
          <Text style={styles.hourLabel}>{formatHour(h)}</Text>
          <View style={styles.hourLine} />
        </View>
      ))}

      {/* Overlap zones (rendered first so bars appear on top) */}
      {bars.map((bar) =>
        bar.overlayHeight > 0 ? (
          <View
            key={`overlay-${bar.key}`}
            style={[
              styles.overlay,
              {
                top: bar.overlayTop,
                height: bar.overlayHeight,
              },
            ]}
          />
        ) : null,
      )}

      {/* Bars */}
      {bars.map((bar) => (
        <React.Fragment key={bar.key}>
          {/* Existing activity bar */}
          <View
            style={[
              styles.bar,
              styles.existingBar,
              {
                top: bar.existingTop,
                height: bar.existingHeight,
              },
            ]}
          >
            <Text style={styles.existingBarText} numberOfLines={1}>
              {bar.title}
            </Text>
          </View>

          {/* Proposed activity bar */}
          <View
            style={[
              styles.bar,
              styles.proposedBar,
              {
                top: bar.proposedTop,
                height: bar.proposedHeight,
              },
            ]}
          >
            <Text style={styles.proposedBarText} numberOfLines={1}>
              Nueva actividad
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  container: {
    backgroundColor: CONTAINER_BG,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: MINI_HOUR_HEIGHT,
  },
  hourLabel: {
    width: LABEL_WIDTH,
    fontSize: 10,
    color: '#686B82',
    textAlign: 'right',
    paddingRight: 4,
    marginTop: -5,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 3,
  },
  overlay: {
    position: 'absolute',
    left: BAR_LEFT,
    right: BAR_RIGHT,
    backgroundColor: OVERLAY_BG,
    borderRadius: 4,
    zIndex: 1,
  },
  bar: {
    position: 'absolute',
    left: BAR_LEFT,
    right: BAR_RIGHT,
    borderRadius: 6,
    borderLeftWidth: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    zIndex: 2,
  },
  existingBar: {
    backgroundColor: EXISTING_BAR_BG,
    borderLeftColor: EXISTING_BAR_BORDER,
    opacity: 0.9,
  },
  existingBarText: {
    color: EXISTING_BAR_TEXT,
    fontSize: 10,
    fontWeight: '600',
  },
  proposedBar: {
    backgroundColor: PROPOSED_BAR_BG,
    borderLeftColor: PROPOSED_BAR_BORDER,
  },
  proposedBarText: {
    color: PROPOSED_BAR_TEXT,
    fontSize: 10,
    fontWeight: '600',
  },
});
