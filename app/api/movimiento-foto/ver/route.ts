import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !url.includes(".blob.vercel-storage.com")) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const result = await get(url, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "content-type": result.blob.contentType || "application/octet-stream",
        "cache-control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la foto" }, { status: 500 });
  }
}
