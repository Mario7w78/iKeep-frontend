import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useChatStore } from '../../../di/Dependencies';
import { NLConversationStep } from '../../components/organisms/CreateActivity/NLConversationStep';

export default function AIChatView({ navigation }: any) {
  const messages = useChatStore((s) => s.messages);
  const isThinking = useChatStore((s) => s.isThinking);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const retry = useChatStore((s) => s.retry);
  const clearChat = useChatStore((s) => s.clearChat);
  const createdActivityId = useChatStore((s) => s.createdActivityId);

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
    <View style={styles.container} testID="ai-chat-view-container">
      <NLConversationStep
        messages={messages}
        onSend={sendMessage}
        isThinking={isThinking}
        onBack={handleBack}
        onRetry={retry}
        onViewActivity={handleViewActivity}
        onClear={clearChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
