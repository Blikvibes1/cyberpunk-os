/**
 * Extensible Command Bus with parsing, metadata and middleware support.
 */

export interface CommandMeta {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  minArgs?: number;
  maxArgs?: number;
}

export interface ParsedCommand {
  name: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

export interface CommandContext {
  parsed: ParsedCommand;
  addLog: (msg: string, level?: 'info' | 'success' | 'warn' | 'error' | 'system') => void;
}

export interface CommandHandler {
  meta: CommandMeta;
  execute(ctx: CommandContext): Promise<void> | void;
}

type Middleware = (
  ctx: CommandContext,
  next: () => Promise<void>
) => Promise<void>;

export class CommandBus {
  private handlers = new Map<string, CommandHandler>();
  private middlewares: Middleware[] = [];

  register(handler: CommandHandler): void {
    const names = [handler.meta.name, ...(handler.meta.aliases ?? [])];
    names.forEach((n) => this.handlers.set(n.toLowerCase(), handler));
  }

  unregister(name: string): void {
    this.handlers.delete(name.toLowerCase());
  }

  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  getAll(): CommandHandler[] {
    const seen = new Set<string>();
    return Array.from(this.handlers.values()).filter((h) => {
      if (seen.has(h.meta.name)) return false;
      seen.add(h.meta.name);
      return true;
    });
  }

  get(name: string): CommandHandler | undefined {
    return this.handlers.get(name.toLowerCase());
  }

  parse(input: string): ParsedCommand {
    const trimmed = input.trim();
    if (!trimmed) return { name: '', args: [], flags: {}, raw: input };

    const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    const name = (tokens.shift() ?? '').toLowerCase().replace(/^["']|["']$/g, '');
    const args: string[] = [];
    const flags: Record<string, string | boolean> = {};

    for (const token of tokens) {
      const clean = token.replace(/^["']|["']$/g, '');
      if (clean.startsWith('--')) {
        const [k, v] = clean.slice(2).split('=');
        flags[k] = v === undefined ? true : v;
      } else if (clean.startsWith('-') && clean.length === 2) {
        flags[clean.slice(1)] = true;
      } else {
        args.push(clean);
      }
    }

    return { name, args, flags, raw: input };
  }

  async execute(
    input: string,
    addLog: CommandContext['addLog']
  ): Promise<void> {
    const parsed = this.parse(input);
    if (!parsed.name) return;

    const handler = this.get(parsed.name);
    if (!handler) {
      addLog(`Unknown command: ${parsed.name}. Type "help" for available commands.`, 'error');
      return;
    }

    const { minArgs = 0, maxArgs = Infinity } = handler.meta;
    if (parsed.args.length < minArgs) {
      addLog(`Usage: ${handler.meta.usage ?? handler.meta.name}`, 'warn');
      return;
    }
    if (parsed.args.length > maxArgs) {
      addLog(`Too many arguments. Usage: ${handler.meta.usage ?? handler.meta.name}`, 'warn');
      return;
    }

    const ctx: CommandContext = { parsed, addLog };

    let index = 0;
    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const mw = this.middlewares[index++];
        await mw(ctx, next);
      } else {
        await handler.execute(ctx);
      }
    };

    try {
      await next();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      addLog(`Command failed: ${message}`, 'error');
    }
  }
}

export const commandBus = new CommandBus();
