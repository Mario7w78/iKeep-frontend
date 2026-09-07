import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../../di/Dependencies';
import { warmUpBackend } from '../../../infrastructure/api/apiConfig';
import { NLConversationStep } from '../../components/organisms/CreateActivity/NLConversationStep';
import { useWizardDraftStore } from "../../../infrastructure/store/useWizardDraftStore";
import { formStateToDraft } from "../../../application/mappers/formStateToDraft";
import { useSugerenciasSapo } from "./useSugerenciasSapo";

export default function AIChatView({ navigation }: any) {
  // The backend sleeps after ~15 min of inactivity and takes 20-50s to wake.
  // Ping it while the user is still typing so their first message does not
  // have to absorb the cold start.
  useEffect(() => {
    warmUpBackend();
  }, []);

  const guardarBorrador = useWizardDraftStore((s) => s.guardar);

  /**
   * Abre el wizard con lo que el asistente ya entendio.
   *
   * Va por el borrador del wizard en vez de por parametros de navegacion:
   * ese camino ya existe y el formulario ya sabe restaurarlo, asi que no hace
   * falta un canal nuevo para lo mismo.
   */
  const ajustarEnWizard = (messageId: string) => {
    const mensaje = useChatStore.getState().messages.find((m: any) => m.id === messageId);
    const parsedState = mensaje?.pendingActivity?.parsedState;
    if (!parsedState) return;

    guardarBorrador(formStateToDraft(parsedState));

    // Si la propuesta era sobre una actividad que ya existe, el wizard tiene
    // que abrirla y no crear otra: sin esto, ajustar una modificacion
    // terminaba en dos actividades con el mismo nombre.
    navigation.navigate("CreateActivityModal", {
      origenChatId: messageId,
      activityId: mensaje?.pendingActivity?.isModification
        ? mensaje.pendingActivity.id
        : undefined,
    });
  };

  const messages = useChatStore((s) => s.messages);
  const isThinking = useChatStore((s) => s.isThinking);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const retry = useChatStore((s) => s.retry);
  const clearChat = useChatStore((s) => s.clearChat);
  const createdActivityId = useChatStore((s) => s.createdActivityId);
  const confirmPendingActivity = useChatStore((s) => s.confirmPendingActivity);
  const cancelPendingActivity = useChatStore((s) => s.cancelPendingActivity);
  const sugerencias = useSugerenciasSapo();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleViewActivity = () => {
    if (createdActivityId) {
      navigation.goBack();
      navigation.navigate('MainTabs', {
        screen: 'Activities',
        params: { selectActivityId: createdActivityId },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']} testID="ai-chat-view-container">
      <NLConversationStep
        messages={messages}
        onSend={sendMessage}
        isThinking={isThinking}
        onBack={handleBack}
        onRetry={retry}
        onViewActivity={handleViewActivity}
        onClear={clearChat}
        onConfirmPending={confirmPendingActivity}
        onCancelPending={cancelPendingActivity}
        onAdjustInWizard={ajustarEnWizard}
        sugerencias={sugerencias}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
