export async function POST(req: Request) {
  const { amount, email, name } = await req.json();

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, // LIVE key from Vercel only
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: `efado-${Date.now()}`,
      amount: amount,
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
      customer: { email, name },
      customizations: { title: "E-Fado Hubs Payment" }
    }),
  });

  const data = await response.json();
  return Response.json(data);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("transaction_id");

  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${id}/verify`, {
    headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
  });
  const data = await res.json();
  return Response.json(data);
}
