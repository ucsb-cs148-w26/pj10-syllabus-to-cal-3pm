export class NextRequest {
  private _body: string;
  public headers: Map<string, string>;
  public method: string;
  public url: string;

  constructor(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
    this.url = url;
    this.method = init?.method ?? 'GET';
    this.headers = new Map(Object.entries(init?.headers ?? {}));
    this._body = init?.body ?? '';
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
  public headers: Map<string, string>;

  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this._body = body;
    this.status = init?.status ?? 200;
    this.headers = new Map(Object.entries(init?.headers ?? {}));
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
}