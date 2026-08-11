import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme/colors';
import { createStyles } from './chatCards.styles';
import { ProposalActions } from './ProposalActions';

interface Props {
  mensaje: { id: string; isConfirmed?: boolean; isCancelled?: boolean };
  propuesta: { originalName?: string | null };
  accion: 'eliminar' | 'regenerar';
  onConfirmPending?: (messageId: string) => Promise<void>;
  onCancelPending?: (messageId: string) => void;
}

/**
 * Eliminar y reorganizar.
 *
 * No construyen una actividad, asi que no traen `parsedState`: la tarjeta de
 * detalles no aplica y accederle reventaba la pantalla. Son propuestas igual
 * —el usuario confirma— pero lo que muestran es otra cosa.
 */
export const SimpleActionCard: React.FC<Props> = ({
  mensaje,
  propuesta,
  accion,
  onConfirmPending,
  onCancelPending,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (       <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {accion === 'eliminar' ? 'Eliminar actividad' : 'Reorganizar horario'}
          </Text>
        </View>
         <View style={styles.simpleActionBody}>
          <Ionicons
            name={accion === 'eliminar' ? 'trash-outline' : 'refresh-outline'}
            size={20}
            color={accion === 'eliminar' ? '#e0555b' : colors.textSecondary}
          />
          <Text style={styles.simpleActionText}>
            {accion === 'eliminar'
              ? propuesta.originalName ?? 'Esta actividad'
              : 'Se recalculan todos tus bloques de la semana.'}
          </Text>
        </View>
         {/* El verbo importa: un boton que dice "Confirmar" no advierte de
            que lo que sigue es irreversible. */}
        <ProposalActions
          mensaje={mensaje}
          textoConfirmar={accion === 'eliminar' ? 'Eliminar' : 'Reorganizar'}
          onConfirmPending={onConfirmPending}
          onCancelPending={onCancelPending}
        />
      </View>
  );
};
