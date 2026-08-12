import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/colors';
import { createStyles } from './chatCards.styles';
import { ProposalActions } from './ProposalActions';
import { DIA_CORTO } from '../../../theme/copy';

interface Props {
  mensaje: { id: string; isConfirmed?: boolean; isCancelled?: boolean };
  propuesta: any;
  onConfirmPending?: (messageId: string) => Promise<void>;
  onCancelPending?: (messageId: string) => void;
  onAdjustInWizard?: (messageId: string) => void;
}

const formatHour = (dateInput: any) => {
  try {
    const d = new Date(dateInput);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '00:00';
  }
};

const formatMins = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatDuration = (mins: number) => {
  if (mins > 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) {
      return `${h} ${h === 1 ? 'hora' : 'horas'}`;
    }
    return `${h} ${h === 1 ? 'hora' : 'horas'} y ${m} min`;
  }
  return `${mins} min`;
};

/** El orden de la semana. Las etiquetas salen del glosario. */
const SEMANA = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo',
];

const normalizeStr = (str: string) => {
  try {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  } catch {
    return str.toLowerCase().trim();
  }
};

/**
 * Lo que el asistente entendio, antes de guardarlo.
 *
 * Vivia dentro de `MessageBubble`, que llego a 823 lineas siendo cuatro cosas
 * a la vez: la burbuja, los botones, la accion simple y esto. Agregarle un
 * quinto tipo de tarjeta era donde se rompia.
 */
export const ActivityProposalCard: React.FC<Props> = ({
  mensaje,
  propuesta,
  onConfirmPending,
  onCancelPending,
  onAdjustInWizard,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const parsedState = propuesta.parsedState;

  const travelTimes = useMemo(() => {
    let travelTo: number | null = null;
    let travelFrom: number | null = null;
    const parsedState = propuesta?.parsedState;
    if (parsedState?.selectedDays && parsedState.daysDict) {
      for (const day of parsedState.selectedDays) {
        const config = parsedState.daysDict[day];
        if (config?.partitions) {
          for (const p of config.partitions) {
            if (p.travelTo !== undefined && p.travelTo !== null) {
              travelTo = p.travelTo;
            }
            if (p.travelFrom !== undefined && p.travelFrom !== null) {
              travelFrom = p.travelFrom;
            }
            if (travelTo !== null || travelFrom !== null) {
              break;
            }
          }
        }
        if (travelTo !== null || travelFrom !== null) {
          break;
        }
      }
    }
    return { travelTo, travelFrom };
  }, [propuesta]);
   const travelText = useMemo(() => {
    const { travelTo, travelFrom } = travelTimes;
    const parts: string[] = [];
    if (travelTo && travelTo > 0) {
      parts.push(`${travelTo} min ida`);
    }
    if (travelFrom && travelFrom > 0) {
      parts.push(`${travelFrom} min vuelta`);
    }
    if (parts.length === 0) return null;
    return parts.join(' / ');
  }, [travelTimes]);

  return (       <View style={styles.card}>
        {/* Header / Mode Indicator */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {propuesta.isModification ? 'Modificar Actividad' : 'Nueva Actividad'}
          </Text>
        </View>
         {/* Context / Modification Target */}
        {propuesta.isModification && (
          <View style={styles.modificationContext}>
            <Text style={styles.contextLabel}>Actividad a editar</Text>
            <Text style={styles.contextValue}>{propuesta.originalName}</Text>
          </View>
        )}
         {/* Activity Name */}
        <View style={styles.nameContainer}>
          <Text style={styles.infoLabel}>Nombre propuesto</Text>
          <Text style={styles.cardActivityName} numberOfLines={2}>
            {parsedState.activityName}
          </Text>
        </View>
         {/* Chips Container */}
        <View style={styles.chipsContainer}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {(() => {
                const identity = parsedState.identity;
                if (identity === 'clase') return 'Clase';
                if (identity === 'trabajo') return 'Trabajo';
                return 'Tarea';
              })()}
            </Text>
          </View>
           <View style={styles.chip}>
            <Text style={styles.chipText}>
              {parsedState.isFixed ? 'Horario Fijo' : 'Flexible'}
            </Text>
          </View>
           {!parsedState.isFixed && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {(() => {
                  const p = parsedState.priority;
                  if (p === 'alta') return 'Prioridad Alta';
                  if (p === 'baja') return 'Prioridad Baja';
                  return 'Prioridad Media';
                })()}
              </Text>
            </View>
          )}
        </View>
         {/* Days mini-blocks row */}
        <View style={styles.daysRowContainer}>
          <Text style={styles.daysRowTitle}>
            {(!parsedState.isFixed && !parsedState.isAnchor)
              ? 'Días permitidos'
              : 'Días'}
          </Text>
          <View style={styles.daysRowGrid}>
            {SEMANA.map((nombre) => {
              const isSelected = parsedState.selectedDays.some((sd: string) =>
                normalizeStr(sd) === normalizeStr(nombre)
              );
              return (
                <View
                  key={nombre} 
                  style={[
                    styles.miniDayBox, 
                    isSelected ? styles.miniDayBoxSelected : styles.miniDayBoxUnselected
                  ]}
                >
                  <Text style={[
                    styles.miniDayText, 
                    isSelected ? styles.miniDayTextSelected : styles.miniDayTextUnselected
                  ]}>
                    {DIA_CORTO[nombre]}
                  </Text>
                </View>
              );
            })}
          </View>
          {(!parsedState.isFixed && !parsedState.isAnchor) && (
            <Text style={styles.daysHelpText}>
              * Se programará un solo día dentro del rango.
            </Text>
          )}
        </View>
         {/* Divider */}
        <View style={styles.cardDivider} />
         {/* Schedule Details Box */}
        <View style={styles.scheduleBox}>
          <Text style={styles.scheduleSectionTitle}>Turnos</Text>
          {parsedState.isFixed ? (
            <View style={styles.scheduleCompactList}>
              {parsedState.selectedDays.map((day: string) => {
                const config = parsedState.daysDict[day];
                if (!config || !config.partitions || config.partitions.length === 0) return null;
                return (
                  <View key={day} style={styles.scheduleCompactRow}>
                    <Text style={styles.scheduleCompactDay}>{DIA_CORTO[day] ?? day}</Text>
                    <Text style={styles.scheduleCompactTime}>
                      {config.partitions.map((p: any) => 
                        `${formatHour(p.startHour)} - ${formatHour(p.endHour)}`
                      ).join(', ')}
                    </Text>
                  </View>
                );
              })}
              {travelText && (
                <View style={styles.travelTimeRow}>
                  <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.travelTimeText}>
                    Traslado: {travelTimes.travelTo ? `${travelTimes.travelTo} min ida` : ''}
                    {travelTimes.travelTo && travelTimes.travelFrom ? ' • ' : ''}
                    {travelTimes.travelFrom ? `${travelTimes.travelFrom} min vuelta` : ''}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.flexibleScheduleContainer}>
              {(() => {
                const start = parsedState.horaPreferidaInicio;
                const end = parsedState.horaPreferidaFin;
                const duration = parsedState.duracionMinutos;
                
                return (
                  <>
                    {start !== null && end !== null && (
                      <View style={styles.scheduleCompactRow}>
                        <Text style={styles.scheduleCompactDayLabel}>Rango hor. pref.</Text>
                        <Text style={styles.scheduleCompactTime}>
                          {formatMins(start)} a {formatMins(end)}
                        </Text>
                      </View>
                    )}
                    {duration && (
                      <View style={styles.scheduleCompactRow}>
                        <Text style={styles.scheduleCompactDayLabel}>Duración estimada</Text>
                        <Text style={styles.scheduleCompactTime}>
                          {formatDuration(duration)}
                        </Text>
                      </View>
                    )}
                    {travelText && (
                      <View style={styles.travelTimeRow}>
                        <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.travelTimeText}>
                          Traslado: {travelTimes.travelTo ? `${travelTimes.travelTo} min ida` : ''}
                          {travelTimes.travelTo && travelTimes.travelFrom ? ' • ' : ''}
                          {travelTimes.travelFrom ? `${travelTimes.travelFrom} min vuelta` : ''}
                        </Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          )}
        </View>
         <ProposalActions
          mensaje={mensaje}
          conAjustar
          onConfirmPending={onConfirmPending}
          onCancelPending={onCancelPending}
          onAdjustInWizard={onAdjustInWizard}
        />
      </View>
  );
};
