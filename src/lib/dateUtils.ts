export const getAgeInMonths = (dateOfBirth: string): number => {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth());
};

export const getFormattedAge = (dateOfBirth: string): string => {
    const months = getAgeInMonths(dateOfBirth);
    if (months < 1) return 'Newborn';
    if (months < 12) return `${months}mo`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}mo`;
};

export const getDevelopmentalStage = (dateOfBirth: string) => {
    const months = getAgeInMonths(dateOfBirth);
    if (months < 3) return { label: 'Newborn', icon: '🍼' };
    if (months < 12) return { label: 'Infant', icon: '👶' };
    if (months < 36) return { label: 'Toddler', icon: '🧸' };
    if (months < 60) return { label: 'Preschool', icon: '🎨' };
    return { label: 'Child', icon: '🌟' };
};
