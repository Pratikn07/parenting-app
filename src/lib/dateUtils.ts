export const getAgeInMonths = (dateOfBirth: string): number => {
    // Parse 'YYYY-MM-DD' as a local-calendar date. `new Date('2026-04-01')`
    // is interpreted by JS as UTC midnight, which becomes the previous day
    // in any timezone west of UTC — producing off-by-one-month errors for
    // birthdays on the 1st of a month for users in the Americas.
    const [y, m, d] = dateOfBirth.split('T')[0].split('-').map(Number);
    const birth = new Date(y, m - 1, d);
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

// Calendar-correct: handles DST and varying month lengths via month arithmetic
// rather than the naïve 1000*60*60*24*30.44 approximation.

/**
 * Check if a date is older than specified hours
 */
export const isOlderThanHours = (date: string | Date, hours: number): boolean => {
    const targetDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > hours;
};
