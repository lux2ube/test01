
/**
 * Generates a unique, human-readable referral code.
 * @param name The user's name.
 * @returns A referral code (e.g., "ALI123").
 */
export function generateReferralCode(name: string): string {
    const namePart = name.slice(0, 3).toUpperCase();
    const randomPart = Math.floor(100 + Math.random() * 900); // Generate a 3-digit number
    return `${namePart}${randomPart}`;
}
