type RequestInitLike = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

type CookieRecord = {
  name: string;
  value: string;
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

class HeaderBag {
  private readonly map = new Map<string, string>();

  constructor(input?: Record<string, string>) {
    for (const [key, value] of Object.entries(input ?? {})) {
      this.map.set(key.toLowerCase(), value);
    }
  }

  get(name: string): string | null {
    return this.map.get(name.toLowerCase()) ?? null;
  }

  set(name: string, value: string): void {
    this.map.set(name.toLowerCase(), value);
  }
}

class CookieStore {
  private readonly map = new Map<string, CookieRecord>();

  get(name: string): CookieRecord | undefined {
    return this.map.get(name);
  }

  set(
    nameOrCookie: string | CookieRecord,
    value?: string,
    options?: Omit<CookieRecord, "name" | "value">
  ): void {
    if (typeof nameOrCookie === "string") {
      this.map.set(nameOrCookie, { name: nameOrCookie, value: value ?? "", ...(options ?? {}) });
      return;
    }
    this.map.set(nameOrCookie.name, nameOrCookie);
  }

  all(): CookieRecord[] {
    return Array.from(this.map.values());
  }
}

function parseCookieHeader(cookieHeader: string | null): CookieRecord[] {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf("=");
      const name = idx >= 0 ? pair.slice(0, idx).trim() : pair.trim();
      const value = idx >= 0 ? pair.slice(idx + 1).trim() : "";
      return { name, value } as CookieRecord;
    });
}

export class NextRequest {
  private _body: string;
  public headers: HeaderBag;
  public method: string;
  public url: string;
  public cookies: CookieStore;

  constructor(url: string, init?: RequestInitLike) {
    this.url = url;
    this.method = init?.method ?? "GET";
    this.headers = new HeaderBag(init?.headers);
    this._body = init?.body ?? "";
    this.cookies = new CookieStore();

    const parsedCookies = parseCookieHeader(this.headers.get("cookie"));
    for (const cookie of parsedCookies) this.cookies.set(cookie);
  }

  async json() {
    return JSON.parse(this._body);
  }

  async text() {
    return this._body;
  }
}

export class NextResponse {
  private _body: string;
  public status: number;
  public headers: HeaderBag;
  public cookies: CookieStore;

  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this._body = body;
    this.status = init?.status ?? 200;
    this.headers = new HeaderBag(init?.headers);
    this.cookies = new CookieStore();
  }

  async json() {
    return JSON.parse(this._body);
  }

  async text() {
    return this._body;
  }

  static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    return new NextResponse(JSON.stringify(data), init);
  }

  static redirect(url: string | URL, init?: { status?: number; headers?: Record<string, string> }) {
    const response = new NextResponse("", { status: init?.status ?? 307, headers: init?.headers });
    response.headers.set("location", String(url));
    return response;
  }
}
