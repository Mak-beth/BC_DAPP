export function gatewayUrl(cid: string): string {
  const base = process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "http://127.0.0.1:8080";
  return `${base}/ipfs/${cid}`;
}

export function publicGatewayUrl(cid: string): string {
  const base = process.env.NEXT_PUBLIC_IPFS_PUBLIC_GATEWAY ?? "https://ipfs.io";
  return `${base}/ipfs/${cid}`;
}

/** Upload a file from the browser by POSTing to our /api/certifications proxy. */
export async function uploadToIPFS(file: File): Promise<{ cid: string; fileName: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/certifications", { method: "POST", body: fd });
  if (!res.ok) {
    const msg = await res.text().catch(() => "IPFS upload failed");
    throw new Error(msg);
  }
  const json = await res.json();
  return { cid: json.cid, fileName: file.name };
}
