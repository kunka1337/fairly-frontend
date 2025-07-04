import { NextResponse } from 'next/server';
import { Connection, sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js';

const NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedTransaction } = body;

    if (!signedTransaction) {
      return NextResponse.json({ error: 'Missing signed transaction' }, { status: 400 });
    }

    const connection = new Connection(NEXT_PUBLIC_RPC_URL!, 'confirmed');
    const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));

    // Send transaction
    const txSignature = await sendAndConfirmRawTransaction(
      connection,
      transaction.serialize(),
      { commitment: 'confirmed' }
    );

    return NextResponse.json({
      success: true,
      signature: txSignature,
    });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 