import { StyleSheet } from 'react-native';
import { Theme } from '../../components/theme/colors';

export const styles = StyleSheet.create({
    headerContainer: {
        flex: 1,
        backgroundColor: '#6200EE'
    },
    container: { 
        flex: 1, 
        backgroundColor: '#F8F9FA'
     },
    formContainerBackground: { 
        flex: 1, 
        backgroundColor: '#FFF' 
    },
    scrollForm: { flex: 1 },
    scrollContent: { 
        paddingHorizontal: 24, 
        paddingTop: 30, 
        paddingBottom: 20 
    },
    section: { marginBottom: 24 },
    footer: {
        paddingHorizontal: 24, 
        paddingBottom: 30, 
        paddingTop: 10, 
        backgroundColor: '#F8F9FA' 
    },
    inputSection: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        marginBottom: 20
    },
    iconContainer: {
        backgroundColor: Theme.colors.border,
        borderRadius: 12,
        padding: 8,
        width: 40,  
        height: 40, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelSmall: {
        fontSize: 20,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
    },
});
