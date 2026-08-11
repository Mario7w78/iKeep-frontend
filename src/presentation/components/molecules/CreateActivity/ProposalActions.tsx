import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../theme/colors';
import { createStyles } from './chatCards.styles';

interface Props {
  mensaje: { id: string; isConfirmed?: boolean; isCancelled?: boolean };
  /**
   * "Confirmar" no dice nada cuando lo que esta en juego es borrar algo. El
   * verbo del boton es lo unico que advierte de que lo que sigue no se
   * deshace.
   */
  textoConfirmar?: string;
  conAjustar?: boolean;
  onConfirmPending?: (messageId: string) => Promise<void>;
  onCancelPending?: (messageId: string) => void;
  onAdjustInWizard?: (messageId: string) => void;
}

/**
 * Los botones de una propuesta pendiente, o su estado si ya se resolvio.
 *
 * Son los mismos para los tres tipos —crear, eliminar, reorganizar—, asi que
 * viven una sola vez.
 */
export const ProposalActions: React.FC<Props> = ({
  mensaje,
  textoConfirmar = 'Confirmar',
  conAjustar = false,
  onConfirmPending,
  onCancelPending,
  onAdjustInWizard,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return !mensaje.isConfirmed && !mensaje.isCancelled ? (
    <>
    {/* El puente al wizard. Sin esto, si el asistente casi acierta el
        usuario tiene que cancelar y rehacer todo a mano: los dos caminos
        quedaban incomunicados. */}
    {conAjustar && onAdjustInWizard && (
      <TouchableOpacity
        testID="adjust-in-wizard-button"
        style={styles.adjustButton}
        onPress={() => onAdjustInWizard(mensaje.id)}
      >
        <Text style={styles.adjustText}>Ajustar detalles</Text>
      </TouchableOpacity>
    )}
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        testID="confirm-activity-button"
        style={[styles.actionButton, styles.confirmButton]}
        onPress={() => onConfirmPending?.(mensaje.id)}
      >
        <Text style={styles.actionButtonText}>{textoConfirmar}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="cancel-activity-button"
        style={[styles.actionButton, styles.cancelButton]}
        onPress={() => onCancelPending?.(mensaje.id)}
      >
        <Text style={styles.actionButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
    </>
  ) : (
    <View style={styles.statusContainer}>
      <Text style={mensaje.isConfirmed ? styles.confirmedText : styles.cancelledText}>
        {mensaje.isConfirmed ? '✓ Confirmado' : '✗ Cancelado'}
      </Text>
    </View>
  )
};
