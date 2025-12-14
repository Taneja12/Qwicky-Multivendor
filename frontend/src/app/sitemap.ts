import { MetadataRoute } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type Vendor = {
    id: number;
};

async function getVendors(): Promise<Vendor[]> {
    try {
        const res = await fetch(`${API_BASE}/api/vendors/vendors/`, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data.results && Array.isArray(data.results)) return data.results;
        if (data.vendors && Array.isArray(data.vendors)) return data.vendors;
        return [];
    } catch (error) {
        // Backend likely down during build, return empty to allow build to pass
        console.warn('Sitemap generation: Could not fetch vendors (backend might be down).');
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const vendors = await getVendors();

    const vendorUrls = vendors.map((vendor) => ({
        url: `${baseUrl}/vendors/${vendor.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/vendors`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...vendorUrls,
    ];
}
