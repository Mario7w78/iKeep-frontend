export const Theme = {
    colors: {
        primary: '#ffffff',
        lightPrimary: '#ebc7ff',
        veryLightPrimary: '#c3ade9',
        lowOpacityPrimary: '#5e3aed74',
        background: '#180b23',
        lightBackground: '#2b1e29',
        surface: '#FFFFFF',
        text: '#1A1A1A',
        textSecondary: '#d4d4d4', 
        border: '#F97316',
        error: '#ff4d4d',
        headerCard: '#322248',
        fixedActivityCard: "#39105dd7",
        flexibleActivityCard: "#8b36d176",
    },
    activity: {
        fixed: {
            gradient: ['#39105dd7', '#4b1d7de6'] as const,
            borderColor: '#5a2591',
            titleColor: '#a46eff',
            dayBoxColor: '#5a2591',
        },
        flexible: {
            gradient: ['#8b36d176', '#aa60e696'] as const,
            borderColor: '#8145b3',
            titleColor: '#ebc7ff',
            dayBoxColor: '#8145b3',
        },
    },
    generalBorder: 20
};

export const LIGHT_COLORS = [
  { bg: '#EEEAFE', border: '#B6A7F5', text: '#4A359C' },
  { bg: '#E8F7F1', border: '#78D3B0', text: '#1F6B55' },
  { bg: '#FFF3E3', border: '#F2B45A', text: '#8A5614' },
  { bg: '#FDEDEA', border: '#F1A18E', text: '#8A3C2A' },
];

export const DARK_COLORS = [
  { bg: '#221A3D', border: '#5D4BB3', text: '#DDD6FF' },
  { bg: '#162A23', border: '#3C8D70', text: '#C8F2E2' },
  { bg: '#33240F', border: '#A86A1F', text: '#FFE3B8' },
  { bg: '#351D18', border: '#A65542', text: '#FFD5CB' },
];

export const GROUP_COLORS = [
  { bg: '#E9E4FF', text: '#4A359C' },
  { bg: '#E3F6EE', text: '#1F6B55' },
  { bg: '#FFF3E3', text: '#8A5614' },
  { bg: '#F8E5FF', text: '#7A2FA0' },
  { bg: '#FDEAEA', text: '#8A3C2A' },
  { bg: '#E3F2FF', text: '#1E5B8A' },
  { bg: '#FFF0E5', text: '#9A4E1A' },
];
export const Screen = {
  margin: 40
}

