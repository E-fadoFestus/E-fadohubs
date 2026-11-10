import { getTransferStatus, verifyTransfer } from '../../../../../lib/paystack';
import { auth } from '../../../../../lib/server-firestore';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = await auth().verifyIdToken(token);
      if (!decoded?.uid) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = (searchParams.get('reference') || '').trim();
    const transfer_code = (searchParams.get('transfer_code') || '').trim();

    if (!reference && !transfer_code) {
      return Response.json({ success: false, error: 'reference or transfer_code required' }, { status: 400 });
    }

    let result: any = null;
    if (reference) {
      try {
        result = await verifyTransfer(reference);
      } catch (e) {
        if (transfer_code) {
          result = await getTransferStatus(transfer_code);
        } else {
          throw e;
        }
      }
    } else if (transfer_code) {
      result = await getTransferStatus(transfer_code);
    }

    const data = result?.data || {};

    return Response.json({
      success: true,
      status: data.status || 'pending',
      amount: data.amount ? Number(data.amount) / 100 : undefined,
      reference: data.reference || reference,
      transfer_code: data.transfer_code || transfer_code,
      recipient: data.recipient?.name
    });

  } catch (error: any) {
    console.error('[Next.js Withdraw Status Error]:', error);
    return Response.json({
      success: false,
      error: error.message || 'Failed to check withdrawal status'
    }, { status: 500 });
  }
}
