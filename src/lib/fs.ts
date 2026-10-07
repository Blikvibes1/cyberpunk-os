/**
 * Simulated filesystem for Cyberpunk OS
 */

export type FsNode =
  | { type: 'dir'; name: string; children: Record<string, FsNode> }
  | { type: 'file'; name: string; content: string };

function dir(name: string, children: Record<string, FsNode> = {}): FsNode {
  return { type: 'dir', name, children };
}
function file(name: string, content: string): FsNode {
  return { type: 'file', name, content };
}

export const rootFs: FsNode = dir('/', {
  home: dir('home', {
    guest: dir('guest', {
      'readme.txt': file(
        'readme.txt',
        'Welcome to the neural filesystem.\nTry: ls, cd, cat, tree, pwd'
      ),
      'notes.md': file('notes.md', '# Night City logs\n- Sector 7 quiet\n- Core resonance stable'),
    }),
    operator: dir('operator', {
      'clearance.dat': file('clearance.dat', 'LEVEL 3 // NIGHT CITY // FULL ACCESS'),
    }),
  }),
  sys: dir('sys', {
    'kernel.log': file(
      'kernel.log',
      '[boot] neural core online\n[bus] command handlers registered\n[gfx] r3f pipeline ready'
    ),
    'version': file('version', 'Cyberpunk OS v0.4.0'),
  }),
  net: dir('net', {
    'nodes.json': file(
      'nodes.json',
      '{\n  "nodes": 14,\n  "encrypted": 2,\n  "sector": "local"\n}'
    ),
  }),
});

export function resolvePath(
  cwd: string,
  input: string
): string {
  if (input.startsWith('/')) return normalize(input);
  const base = cwd === '/' ? '' : cwd;
  return normalize(`${base}/${input}`);
}

function normalize(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  return '/' + stack.join('/');
}

export function getNode(path: string): FsNode | null {
  if (path === '/') return rootFs;
  const parts = path.split('/').filter(Boolean);
  let cur: FsNode = rootFs;
  for (const p of parts) {
    if (cur.type !== 'dir' || !cur.children[p]) return null;
    cur = cur.children[p];
  }
  return cur;
}

export function listDir(path: string): string[] | null {
  const node = getNode(path);
  if (!node || node.type !== 'dir') return null;
  return Object.keys(node.children).sort();
}

export function readFile(path: string): string | null {
  const node = getNode(path);
  if (!node || node.type !== 'file') return null;
  return node.content;
}

export function treeLines(path: string = '/', prefix = '', isLast = true): string[] {
  const node = getNode(path);
  if (!node) return ['(not found)'];
  const name = path === '/' ? '/' : node.name;
  const lines = [`${prefix}${isLast ? '└─ ' : '├─ '}${name}${node.type === 'dir' ? '/' : ''}`];
  if (node.type === 'dir') {
    const keys = Object.keys(node.children).sort();
    keys.forEach((k, i) => {
      const childPath = path === '/' ? `/${k}` : `${path}/${k}`;
      const last = i === keys.length - 1;
      const nextPrefix = prefix + (isLast ? '   ' : '│  ');
      lines.push(...treeLines(childPath, nextPrefix, last));
    });
  }
  return lines;
}
