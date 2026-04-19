import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { createRequire } from "module";
import { claudeChat } from "@/lib/claude";
import { categorizeLocal } from "@/lib/categorize";

export const runtime = "nodejs";
// PDFs can be large; bump body size limit.
export const maxDuration = 60;

interface ParsedTxn {
  date: string;
  merchant: string;
  amount: number;
  type: "debit" | "credit";
  category?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string | null) || "";
    if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());

    // ---- 1. Extract text from PDF --------------------------------------
    // `pdf-parse`'s root index.js runs a debug self-test that breaks under
    // Next's bundler. We target the inner lib file directly via
    // createRequire + absolute path, which sidesteps both webpack (it
    // doesn't rewrite dynamic createRequire calls) and the package's
    // `exports` field (absolute paths bypass exports enforcement).
    const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));
    const pdfParsePath = path.join(process.cwd(), "node_modules", "pdf-parse", "lib", "pdf-parse.js");
    const pdfParse = nodeRequire(pdfParsePath);
    let rawText = "";
    try {
      // pdf-parse forwards `password` to pdf.js via pagerender/options.
      const parsed = await pdfParse(buf, password ? ({ password } as any) : undefined);
      rawText = parsed.text || "";
    } catch (e: any) {
      const msg = String(e?.message || e?.name || "");
      const needsPw = /password/i.test(msg) || e?.name === "PasswordException" || e?.code === 1 || e?.code === 2;
      if (needsPw) {
        return NextResponse.json(
          {
            error: password
              ? "Incorrect password for this PDF. Try again (banks often use PAN+DOB or account+DOB)."
              : "This PDF is password-protected. Enter the password to unlock it.",
            needsPassword: true,
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Couldn't read PDF. Make sure it's a text-based statement, not a scanned image." },
        { status: 400 }
      );
    }

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: "PDF appears empty or image-only. Try exporting a text-based statement from your bank." },
        { status: 400 }
      );
    }

    // Cap text length — bank statements can be huge, and we only need the
    // transaction table. Trim to ~20K chars (roughly 4-6K tokens).
    const text = rawText.slice(0, 20000);

    // ---- 2. Ask Claude to extract structured transactions --------------
    const system = `You are a precise bank-statement parser for Indian bank PDFs (HDFC, SBI, ICICI, Axis, Kotak, etc.).
Extract ONLY the transaction table rows. Return STRICT JSON — no commentary, no markdown fences.
Format:
{"transactions":[{"date":"YYYY-MM-DD","merchant":"<payee/narration short name>","amount":<number>,"type":"debit"|"credit"}]}

Rules:
- Combine narration/description into a short merchant name (e.g. "UPI/SWIGGY/..." → "Swiggy").
- amount is always positive; use type="debit" for withdrawals/payments and type="credit" for deposits/salary/refunds.
- Skip opening balance, closing balance, and running-balance-only rows.
- Dates: convert any format (DD/MM/YYYY, DD-MM-YY, etc.) to ISO YYYY-MM-DD.
- If nothing parseable, return {"transactions":[]}.`;

    const { text: aiOut } = await claudeChat({
      system,
      messages: [{ role: "user", content: `Parse this statement:\n\n${text}` }],
      max_tokens: 4000,
    });

    // ---- 3. Parse Claude's JSON output ---------------------------------
    let txns: ParsedTxn[] = [];
    try {
      // Extract first JSON object defensively (in case Claude adds wrapper).
      const match = aiOut.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : aiOut);
      txns = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    } catch (e: any) {
      return NextResponse.json(
        {
          error: "AI couldn't parse statement. Try a CSV upload instead.",
          raw: aiOut.slice(0, 500),
        },
        { status: 500 }
      );
    }

    // ---- 4. Clean up + auto-categorize ---------------------------------
    const cleaned = txns
      .filter((t) => t && t.merchant && t.amount > 0 && (t.type === "debit" || t.type === "credit"))
      .map((t) => ({
        date: t.date || new Date().toISOString().slice(0, 10),
        merchant: String(t.merchant).slice(0, 80),
        amount: Math.abs(Number(t.amount)) || 0,
        type: t.type,
        category: t.category || categorizeLocal(t.merchant),
      }));

    return NextResponse.json({ transactions: cleaned, count: cleaned.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
