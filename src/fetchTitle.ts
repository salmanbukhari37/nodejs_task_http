// fetchTitle.ts
import * as http from "http";
import * as https from "https";
import { URL } from "url";
import { TitleResult } from "./interfaces/TitleResult";

export function fetchTitle(
  address: string,
  callback: (err: Error | null, result: TitleResult | null) => void
): void {
  // Automatically add 'http://' if the protocol is missing
  if (!/^https?:\/\//i.test(address)) {
    address = `http://${address}`;
  }

  const parsedUrl = new URL(address);
  const protocol = parsedUrl.protocol === "https:" ? https : http;

  const request = protocol.get(address, (res) => {
    // Handle HTTP redirects
    if (
      res.statusCode &&
      res.statusCode >= 300 &&
      res.statusCode < 400 &&
      res.headers.location
    ) {
      // Recursively follow the redirect
      fetchTitle(res.headers.location, callback);
      return;
    }

    let data = "";

    res.on("data", (chunk: Buffer) => {
      data += chunk.toString();
    });

    res.on("end", () => {
      const match = data.match(/<title>([^<]*)<\/title>/);
      const title = match ? match[1] : "NO RESPONSE";
      callback(null, { address, title });
    });
  });

  request.on("error", () => {
    callback(null, { address, title: "NO RESPONSE" });
  });
}
