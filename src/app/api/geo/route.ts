import { NextResponse } from 'next/server';
import { getGeoFromHeaders } from '@/lib/server-geo';

export async function GET() {
    try {
        const geoData = await getGeoFromHeaders();
        
        return NextResponse.json({ 
            country: geoData.country || 'SA',
            city: geoData.city || 'Unknown',
            ip: geoData.ip || 'unknown'
        });
    } catch (error) {
        console.error('Error in /api/geo:', error);
        return NextResponse.json({ country: 'SA', city: 'Unknown', ip: 'unknown' }, { status: 200 });
    }
}
