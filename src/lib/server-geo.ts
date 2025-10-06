import { headers } from 'next/headers';

export async function getCountryFromHeaders(): Promise<string | null> {
    try {
        const headersList = await headers();
        const forwarded = headersList.get('x-forwarded-for');
        const realIp = headersList.get('x-real-ip');
        
        const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || null;
        
        if (!ip || ip === 'localhost' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return null;
        }

        const token = process.env.IPINFO_TOKEN;
        
        if (token) {
            const response = await fetch(`https://ipinfo.io/${ip}/country?token=${token}`, {
                next: { revalidate: 3600 }
            });
            
            if (response.ok) {
                const country = await response.text();
                return country.trim().toUpperCase();
            }
        }
        
        const fallbackResponse = await fetch(`https://ipapi.co/${ip}/country_code/`, {
            next: { revalidate: 3600 }
        });
        
        if (fallbackResponse.ok) {
            const country = await fallbackResponse.text();
            return country.trim().toUpperCase();
        }
        
        return null;
    } catch (error) {
        console.error('Error detecting country from IP:', error);
        return null;
    }
}

export async function getGeoFromHeaders(): Promise<{ country: string | null; ip: string | null; city: string | null; region?: string }> {
    try {
        const headersList = await headers();
        const forwarded = headersList.get('x-forwarded-for');
        const realIp = headersList.get('x-real-ip');
        const cfConnectingIp = headersList.get('cf-connecting-ip');
        const trueClientIp = headersList.get('true-client-ip');
        
        console.log('Headers check:', { forwarded, realIp, cfConnectingIp, trueClientIp });
        
        const ip = cfConnectingIp || trueClientIp || (forwarded ? forwarded.split(',')[0].trim() : realIp) || null;
        
        console.log('Detected IP:', ip);
        
        if (!ip || ip === 'localhost' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            console.log('Private/local IP detected, skipping geo lookup');
            return { country: null, ip, city: null };
        }

        const token = process.env.IPINFO_TOKEN;
        console.log('IPINFO_TOKEN exists:', !!token);
        
        if (token) {
            try {
                const url = `https://ipinfo.io/${ip}?token=${token}`;
                console.log('Fetching from IPinfo:', url.replace(token, '***'));
                
                const response = await fetch(url, {
                    next: { revalidate: 3600 }
                });
                
                console.log('IPinfo response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('IPinfo SUCCESS:', { ip, country: data.country, city: data.city, region: data.region });
                    
                    const country = data.country?.toUpperCase() || null;
                    const city = data.city || null;
                    
                    return {
                        country: country || (city ? await detectCountryByCity(city) : null),
                        city: city,
                        region: data.region || undefined,
                        ip: data.ip || ip
                    };
                } else {
                    const errorText = await response.text();
                    console.error('IPinfo API error:', response.status, errorText);
                }
            } catch (err) {
                console.error('IPinfo fetch error:', err);
            }
        } else {
            console.log('No IPINFO_TOKEN available, trying fallback');
        }
        
        try {
            const fallbackResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
                next: { revalidate: 3600 }
            });
            
            if (fallbackResponse.ok) {
                const data = await fallbackResponse.json();
                console.log('IPapi data:', { ip, country: data.country_code, city: data.city, region: data.region });
                
                const country = data.country_code?.toUpperCase() || null;
                const city = data.city || null;
                
                return {
                    country: country || (city ? await detectCountryByCity(city) : null),
                    city: city,
                    region: data.region || undefined,
                    ip: data.ip || ip
                };
            }
        } catch (err) {
            console.error('IPapi fetch error:', err);
        }
        
        return { country: null, ip, city: null };
    } catch (error) {
        console.error('Error detecting geo from IP:', error);
        return { country: null, ip: null, city: null };
    }
}

async function detectCountryByCity(city: string): Promise<string | null> {
    const cityCountryMap: Record<string, string> = {
        'Cairo': 'EG', 'Alexandria': 'EG', 'Giza': 'EG',
        'Riyadh': 'SA', 'Jeddah': 'SA', 'Mecca': 'SA', 'Medina': 'SA', 'Dammam': 'SA',
        'Dubai': 'AE', 'Abu Dhabi': 'AE', 'Sharjah': 'AE',
        'Kuwait City': 'KW',
        'Doha': 'QA',
        'Manama': 'BH',
        'Muscat': 'OM',
        'Amman': 'JO',
        'Beirut': 'LB',
        'Baghdad': 'IQ',
        'Damascus': 'SY',
        'Sana\'a': 'YE', 'Aden': 'YE',
        'Ramallah': 'PS', 'Gaza': 'PS',
        'Khartoum': 'SD',
        'Tunis': 'TN',
        'Algiers': 'DZ',
        'Rabat': 'MA', 'Casablanca': 'MA',
        'Tripoli': 'LY',
        'Nouakchott': 'MR',
    };
    
    return cityCountryMap[city] || null;
}
