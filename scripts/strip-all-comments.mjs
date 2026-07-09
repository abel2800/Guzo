import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');

const INCLUDE_DIRS = ['apps', 'packages', 'scripts'];
const EXT_TS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const EXT_JAVA = new Set(['.java']);
const EXT_PS1 = new Set(['.ps1']);

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  '.expo',
  'coverage',
  'target',
  '.git',
]);

const SKIP_FILES = new Set(['next-env.d.ts', 'expo-env.d.ts']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function scriptKindFor(filePath) {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (filePath.endsWith('.ts')) return ts.ScriptKind.TS;
  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX;
  return ts.ScriptKind.JS;
}

function stripTsLikeComments(sourceText, filePath) {
  const kind = scriptKindFor(filePath);
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, kind);
  const ranges = [];

  const collect = (pos) => {
    const leading = ts.getLeadingCommentRanges(sourceText, pos);
    if (leading) ranges.push(...leading);
  };

  collect(0);

  const visit = (node) => {
    const leading = ts.getLeadingCommentRanges(sourceText, node.getFullStart());
    if (leading) ranges.push(...leading);
    const trailing = ts.getTrailingCommentRanges(sourceText, node.end);
    if (trailing) ranges.push(...trailing);
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  const unique = new Map();
  for (const r of ranges) {
    unique.set(`${r.pos}:${r.end}`, r);
  }

  const sorted = [...unique.values()].sort((a, b) => b.pos - a.pos);
  let result = sourceText;
  for (const r of sorted) {
    let start = r.pos;
    let end = r.end;
    if (result[end] === '\n' && result[start - 1] === '\n') {
      end += 1;
    } else if (result[end] === '\r' && result[end + 1] === '\n') {
      end += 2;
    } else if (result[end] === '\n') {
      const lineStart = result.lastIndexOf('\n', start - 1) + 1;
      const before = result.slice(lineStart, start);
      if (before.trim() === '') {
        start = lineStart;
        end += 1;
      }
    }
    result = result.slice(0, start) + result.slice(end);
  }

  return result.replace(/\n{3,}/g, '\n\n');
}

function stripJavaComments(sourceText) {
  let result = '';
  let i = 0;
  const len = sourceText.length;

  while (i < len) {
    if (sourceText[i] === '"' || sourceText[i] === '\'') {
      const quote = sourceText[i];
      result += quote;
      i += 1;
      while (i < len) {
        if (sourceText[i] === '\\') {
          result += sourceText[i] + (sourceText[i + 1] ?? '');
          i += 2;
          continue;
        }
        result += sourceText[i];
        if (sourceText[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (sourceText[i] === '/' && sourceText[i + 1] === '/') {
      i += 2;
      while (i < len && sourceText[i] !== '\n') i += 1;
      continue;
    }

    if (sourceText[i] === '/' && sourceText[i + 1] === '*') {
      i += 2;
      while (i < len - 1 && !(sourceText[i] === '*' && sourceText[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    result += sourceText[i];
    i += 1;
  }

  return result.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}

function stripPs1Comments(sourceText) {
  const lines = sourceText.split(/\r?\n/);
  const out = lines.map((line) => {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      if (ch === '"' && !inSingle) inDouble = !inDouble;
      if (ch === '#' && !inSingle && !inDouble) {
        return line.slice(0, i).replace(/[ \t]+$/, '');
      }
    }
    return line;
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function stripInlineAndJsxComments(sourceText) {
  let result = sourceText.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
  result = result.replace(/\/\*[\s\S]*?\*\
  const lines = result.split('\n');
  result = lines
    .map((line) => {
      let inSingle = false;
      let inDouble = false;
      let inTemplate = false;
      for (let i = 0; i < line.length - 1; i++) {
        const ch = line[i];
        if (ch === "'" && !inDouble && !inTemplate) inSingle = !inSingle;
        if (ch === '"' && !inSingle && !inTemplate) inDouble = !inDouble;
        if (ch === '`' && !inSingle && !inDouble) inTemplate = !inTemplate;
        if (ch === '/' && line[i + 1] === '/' && !inSingle && !inDouble && !inTemplate) {
          return line.slice(0, i).replace(/[ \t]+$/, '');
        }
      }
      return line;
    })
    .join('\n');
  return result.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
}

function processFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  if (SKIP_FILES.has(path.basename(filePath))) return false;

  const ext = path.extname(filePath).toLowerCase();
  const sourceText = fs.readFileSync(filePath, 'utf8');
  let stripped = sourceText;

  if (EXT_TS.has(ext)) {
    stripped = stripTsLikeComments(sourceText, filePath);
    stripped = stripInlineAndJsxComments(stripped);
  } else if (EXT_JAVA.has(ext)) {
    stripped = stripJavaComments(sourceText);
  } else if (EXT_PS1.has(ext)) {
    stripped = stripPs1Comments(sourceText);
  } else {
    return false;
  }

  if (stripped !== sourceText) {
    fs.writeFileSync(filePath, stripped, 'utf8');
    return true;
  }
  return false;
}

const files = INCLUDE_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
let changed = 0;

for (const file of files) {
  if (processFile(file)) {
    changed += 1;
    console.log('stripped:', path.relative(ROOT, file));
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
