import { NextResponse } from 'next/server';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PINATA_JWT = process.env.PINATA_JWT;
const NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const POOL_CONFIG_KEY = process.env.NEXT_PUBLIC_POOL_CONFIG_KEY;

if (!NEXT_PUBLIC_RPC_URL || !POOL_CONFIG_KEY) {
  throw new Error('Missing required Solana environment variables');
}

async function uploadToPinata(file: Buffer, fileName: string, mimeType: string) {
  const formData = new FormData();
  formData.append('file', new Blob([file], { type: mimeType }), fileName);

  const headers: Record<string, string> = PINATA_JWT
    ? { Authorization: `Bearer ${PINATA_JWT}` }
    : {
      pinata_api_key: PINATA_API_KEY!,
      pinata_secret_api_key: PINATA_API_SECRET!,
    };

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers,
    body: formData as any,
  } as any);

  if (!res.ok) throw new Error('Failed to upload to Pinata');
  const data = await res.json();
  return `https://ipfs.io/ipfs/${data.IpfsHash}`;
}

async function uploadJSONToPinata(json: object) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
        pinata_api_key: PINATA_API_KEY!,
        pinata_secret_api_key: PINATA_API_SECRET!,
      }),
  };

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers,
    body: JSON.stringify(json),
  });

  if (!res.ok) throw new Error('Failed to upload JSON to Pinata');
  const data = await res.json();
  return `https://ipfs.io/ipfs/${data.IpfsHash}`;
}

type UploadRequest = {
  tokenLogo: string;
  tokenName: string;
  tokenSymbol: string;
  description?: string;
  mint: string;
  website?: string;
  twitter?: string;
  telegram?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as UploadRequest;
    const {
      tokenLogo,
      tokenName,
      tokenSymbol,
      description,
      mint,
      website,
      twitter,
      telegram
    } = body;

    if (!tokenLogo || !tokenName || !tokenSymbol || !mint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert base64 image to Buffer
    const base64Data = tokenLogo.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 });
    }
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imageUrl = await uploadToPinata(imageBuffer, `${mint}-logo.png`, 'image/png');

    const metadata: Record<string, any> = {
      name: tokenName,
      symbol: tokenSymbol,
      ...(description ? { description } : {}),
      image: imageUrl,
    };
    if (website) metadata.website = website;
    if (twitter) metadata.twitter = twitter;
    if (telegram) metadata.telegram = telegram;
    metadata.platform = 'https://fairly.best';

    // Upload metadata to Pinata
    const metadataUrl = await uploadJSONToPinata(metadata);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      metadataUrl: metadataUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 