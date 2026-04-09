import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, ScrollView } from 'react-native';

interface DropdownMenuProps {
    visible: boolean;
    handleClose: () => void;
    handleOpen: () => void;
    trigger: React.ReactNode;
    children: React.ReactNode;
    dropdownWidth?: number;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
    visible,
    handleOpen,
    handleClose,
    trigger,
    children,
    dropdownWidth = 150,
}) => {
    const triggerRef = useRef<View>(null);
    const [position, setPosition] = useState({ x: 0, y: 0, width: 0 });

    useEffect(() => {
        if (triggerRef.current && visible) {
            triggerRef.current.measure((fx, fy, width, height, px, py) => {
                setPosition({
                    x: px,
                    y: py + height,
                    width: width,
                });
            });
        }
    }, [visible]);

    return (
        <View>
            <TouchableWithoutFeedback onPress={handleOpen}>
                <View ref={triggerRef}>{trigger}</View>
            </TouchableWithoutFeedback>

            {visible && (
                <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
                    <TouchableWithoutFeedback onPress={handleClose}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View
                                    style={[
                                        styles.menuContainer,
                                        {
                                            top: position.y,
                                            left: position.x + (position.width / 2) - (dropdownWidth / 2),
                                            width: dropdownWidth,
                                        },
                                    ]}
                                >
                                    <ScrollView
                                        style={styles.scrollView}
                                        showsVerticalScrollIndicator={true}
                                        nestedScrollEnabled={true}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {children}
                                    </ScrollView>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menuContainer: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    scrollView: {
        maxHeight: 250,
        paddingHorizontal: 5,
    },
});