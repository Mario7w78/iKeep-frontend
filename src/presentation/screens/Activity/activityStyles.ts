import { StyleSheet } from 'react-native';
import { Theme } from '../../components/theme/colors';

export const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Theme.colors.background,
     },
    formContainerBackground: { 
        flex: 1, 
    },
    scrollForm: { flex: 1 },
    scrollContent: { 
        paddingHorizontal: 24, 
        paddingTop: 30, 
        paddingBottom: 20,
        gap: 20
    },
    section: { 
        width:'50%',
     },
    timeSection: {
        flexDirection: 'column',
        backgroundColor: Theme.colors.lightBackground,
        borderRadius: Theme.generalBorder,
        padding: 20,
    },
    timeInnerSection: {
        flexDirection: 'row',
    },
    footer: {
        paddingHorizontal: 24, 
        paddingBottom: 30, 
        paddingTop: 10, 
    },
    inputSection: {
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    iconContainer: {
        backgroundColor: Theme.colors.border,
        borderRadius: 7,
        width: 25,  
        height: 25, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon2Container: {
        backgroundColor: Theme.colors.primary,
        borderRadius: 7,
        width: 35,  
        height: 35, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelSmall: {
        fontSize: 20,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
        marginBottom: 10
    },
    label: {
        fontSize: 20,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
    },
    subLabelSmall: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
    },
    descriptionLabel: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
    },
    messages: {
        fontSize: 15,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
        textAlign: 'center',
        marginVertical: 20
    },
    frecuencySection: {
        flexDirection: 'column',
        backgroundColor: Theme.colors.lightBackground,
        borderRadius: Theme.generalBorder,
        padding: 20,
    }
});
