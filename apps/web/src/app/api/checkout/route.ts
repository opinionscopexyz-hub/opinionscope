import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

// Product IDs stored server-side only
const POLAR_PRODUCTS = {
  pro_monthly: process.env.POLAR_PRO_MONTHLY_ID ?? "",
  pro_annual: process.env.POLAR_PRO_ANNUAL_ID ?? "",
  pro_plus_monthly: process.env.POLAR_PRO_PLUS_MONTHLY_ID ?? "",
  pro_plus_annual: process.env.POLAR_PRO_PLUS_ANNUAL_ID ?? "",
} as const;

type ProductKey = keyof typeof POLAR_PRODUCTS;

function isValidProductKey(key: string): key is ProductKey {
  return key in POLAR_PRODUCTS;
}

export async function POST(req: Request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { plan, isAnnual } = body;

    if (!plan || typeof plan !== "string") {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    // Determine product key
    let productKey: string;
    if (plan === "pro") {
      productKey = isAnnual ? "pro_annual" : "pro_monthly";
    } else if (plan === "pro_plus") {
      productKey = isAnnual ? "pro_plus_annual" : "pro_plus_monthly";
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!isValidProductKey(productKey)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const productId = POLAR_PRODUCTS[productKey];
    if (!productId) {
      return NextResponse.json(
        { error: "Product not configured" },
        { status: 500 }
      );
    }

    // Build checkout URL (sandbox for dev, production for prod)
    const polarCheckoutUrl = process.env.POLAR_CHECKOUT_URL ?? "https://checkout.polar.sh";
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://opinionscope.xyz"}/billing?success=true`;
    const checkoutUrl = `${polarCheckoutUrl}?product_id=${encodeURIComponent(productId)}&customer_email=${encodeURIComponent(email)}&success_url=${encodeURIComponent(successUrl)}`;

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
