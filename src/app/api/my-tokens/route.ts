import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

interface FairlyToken {
  token_id: string;
  creator_id: string;
  name: string;
  symbol: string;
  description: string | null;
  image: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Query the database for tokens created by this wallet
    const client = await pool.connect();
    try {
      const query = 'SELECT * FROM fairlytokens WHERE creator_id = $1 ORDER BY token_id DESC';
      const result = await client.query(query, [walletAddress]);
      
      // Transform database results to match the expected TokenWithPool format
      const tokens = result.rows.map((row: FairlyToken) => ({
        id: row.token_id,
        name: row.name,
        symbol: row.symbol,
        marketCap: 0, // Not needed but kept for compatibility
        volume: 0, // Not needed but kept for compatibility
        progress: 100, // Assume all user tokens are bonded
        category: 'bonded' as const,
        image: row.image || null,
        createdAt: new Date().toISOString(), // Default to now since we don't have creation time
        description: row.description,
        website: row.website,
        twitter: row.twitter,
        telegram: row.telegram,
        pool: {
          id: `pool_${row.token_id}`,
          baseAsset: {
            id: row.token_id,
            name: row.name,
            symbol: row.symbol,
            icon: row.image || null,
            mcap: 0,
            usdPrice: 0,
            stats24h: {
              priceChange: 0,
              numBuys: 0,
              numSells: 0,
            }
          },
          volume24h: 0,
          bondingCurve: 100,
          createdAt: new Date().toISOString(),
        }
      }));

      return NextResponse.json(tokens);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
} 