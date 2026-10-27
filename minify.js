"use strict";
/*
  Minifier used by build.js. No dependencies.

  It only removes what the browser does not need: comments and whitespace.
  Names, strings and logic are never changed, so the minified app behaves
  exactly like the readable one (run `node build.js --pretty` to compare).

    minifyJS(code)   reads the code token by token (strings, template
                     literals with ${…} inside, regular expressions, comments)
                     and keeps a line break only where JavaScript's automatic
                     semicolon insertion could depend on it. In template
                     literals that hold HTML, the indentation after a line
                     break is dropped (HTML treats any run of whitespace alike).
    minifyCSS(css)   removes comments and the whitespace around { } ; , > and
                     after ":"; strings and url(…) are kept as they are.
*/

const isWord = c => /[A-Za-z0-9_$\u0080-\uffff]/.test(c);
const REGEX_AFTER = new Set(["return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"]);

/* ---------------- JavaScript ---------------- */
function minifyJS(src){
  let i = 0;
  const n = src.length;

  // Read tokens until the end, or (inside a template's ${…}) until the matching "}".
  function lex(inExpr){
    const toks = [];
    let depth = 0, gap = "";                 // gap: "" | " " | "\n" (whitespace or comments before the next token)
    const push = (type, v) => { toks.push({ type, v, gap }); gap = ""; };
    const prev = () => toks[toks.length - 1];
    while (i < n){
      const c = src[i], d = src[i + 1];
      if (c === "\n" || c === "\r"){ gap = "\n"; i++; continue; }
      if (c === " " || c === "\t" || c === "\f" || c === "\v" || c === "\ufeff" || c === "\u00a0"){ if (!gap) gap = " "; i++; continue; }
      if (c === "/" && d === "/"){ while (i < n && src[i] !== "\n") i++; continue; }
      if (c === "/" && d === "*"){
        const end = src.indexOf("*/", i + 2); if (end < 0) throw new Error("unclosed comment");
        if (src.slice(i, end).includes("\n")) gap = "\n"; else if (!gap) gap = " ";
        i = end + 2; continue;
      }
      if (c === "'" || c === '"'){ push("str", readString(c)); continue; }
      if (c === "`"){ push("tpl", readTemplate()); continue; }
      if (c === "/" && regexAllowed(prev())){ push("re", readRegex()); continue; }
      if (isWord(c)){
        let j = i; while (j < n && isWord(src[j])) j++;
        // numbers with exponents (1e-9) and decimals (0.5) stay one token
        if (/^\d/.test(src.slice(i, j))){
          while (j < n && (isWord(src[j]) || src[j] === "." || ((src[j] === "-" || src[j] === "+") && /e$/i.test(src.slice(i, j)) && /^\d/.test(src.slice(i, j))))) j++;
        }
        push("w", src.slice(i, j)); i = j; continue;
      }
      if (inExpr){
        if (c === "{") depth++;
        if (c === "}"){ if (depth === 0){ i++; return toks; } depth--; }
      }
      push("p", c); i++;
    }
    if (inExpr) throw new Error("unclosed ${ in template literal");
    return toks;
  }
  function readString(q){
    let j = i + 1;
    while (j < n && src[j] !== q){ if (src[j] === "\\") j++; if (src[j] === "\n") throw new Error("unterminated string"); j++; }
    const s = src.slice(i, j + 1); i = j + 1; return s;
  }
  function readTemplate(){
    let out = "`", j = i + 1, text = "";
    const parts = [];
    while (j < n){
      const c = src[j];
      if (c === "\\"){ text += c + src[j + 1]; j += 2; continue; }
      if (c === "`"){ parts.push(text); i = j + 1; break; }
      if (c === "$" && src[j + 1] === "{"){
        parts.push(text); text = "";
        i = j + 2; parts.push({ expr: emit(lex(true)) }); j = i; continue;
      }
      text += c; j++;
    }
    const html = parts.some(p => typeof p === "string" && p.includes("<"));
    for (const p of parts) out += typeof p === "string" ? (html ? p.replace(/\n[ \t]+/g, "\n") : p) : "${" + p.expr + "}";
    return out + "`";
  }
  function readRegex(){
    let j = i + 1, cls = false;
    while (j < n){
      const c = src[j];
      if (c === "\\"){ j += 2; continue; }
      if (c === "\n") throw new Error("unterminated regular expression");
      if (cls){ if (c === "]") cls = false; }
      else if (c === "[") cls = true;
      else if (c === "/") break;
      j++;
    }
    j++; while (j < n && /[a-z]/i.test(src[j])) j++;
    const s = src.slice(i, j); i = j; return s;
  }
  function regexAllowed(p){
    if (!p) return true;
    if (p.type === "w") return REGEX_AFTER.has(p.v);
    if (p.type === "p") return !")]}".includes(p.v);
    return false;                                   // after a string, template or regex: division
  }
  return emit(lex(false));
}

/* Join tokens with the least whitespace that keeps the meaning. */
function emit(toks){
  let out = "";
  const endsValue = t => t.type !== "p" || ")]}".includes(t.v);
  const startsValue = t => t.type !== "p" || "([{+-!~".includes(t.v);
  for (let k = 0; k < toks.length; k++){
    const t = toks[k], p = toks[k - 1];
    if (t.type === "w" && /^0\.\d/.test(t.v)){                             // 0.5 → .5 (the same number)
      t.v = t.v.slice(1);
      if (out.endsWith(".")) out += " ";
    }
    if (p && t.gap){
      const last = out[out.length - 1], first = t.v[0];
      if (t.gap === "\n" && endsValue(p) && startsValue(t)) out += "\n";        // automatic semicolon insertion may apply here
      else if (isWord(last) && isWord(first)) out += " ";
      else if ((last === "+" || last === "-") && first === last) out += " ";    // a + +b, a - -b
      else if (last === "/" && (first === "/" || first === "*")) out += " ";
      else if (p.type === "w" && /^\d+$/.test(p.v) && first === ".") out += " ";
      else if (p.type === "re" && isWord(first)) out += " ";
    }
    out += t.v;
  }
  return out;
}

/* ---------------- CSS ---------------- */
function minifyCSS(css){
  const keep = [];
  const hold = s => `\u0000${keep.push(s) - 1}\u0000`;
  css = css
    .replace(/url\((?:[^()'"]|'[^']*'|"[^"]*")*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, hold)   // strings and url(…)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,>])\s*/g, "$1")
    .replace(/:\s+/g, ":")
    .replace(/;}/g, "}")
    .trim();
  return css.replace(/\u0000(\d+)\u0000/g, (_, k) => keep[+k]);
}

/* ---------------- Shorter names ----------------
   shortenNames(code) gives every variable, parameter, function and class
   a one- or two-letter name in the built file. Only names change: property
   names (obj.prop, { key: … }), strings and logic stay exactly as they are,
   and globals the app does not declare (document, Math, …) are left alone.
   Two more changes that cannot alter what the code does: "const" is written
   "let" when no constant is ever assigned to, and the "use strict" lines of
   every file after the first are dropped (the first one already covers the
   whole built script).

   It needs a JavaScript parser. Node ships one (acorn) but only exposes it
   with the --expose-internals flag, so the work runs in a child Node process.
   If that fails for any reason the build keeps the long names and says why.

   How the names are chosen: the code is split into scopes (functions and
   blocks). Each name is resolved to the declaration it refers to. Scopes are
   then named from the outside in; a declaration takes the shortest name that
   is not already used in its scope, by an outer declaration that is used
   inside it, or by an undeclared global used inside it. So no reference can
   end up pointing at a different variable than before.
*/
const FIRST = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
const NEXT = FIRST + "0123456789";
const RESERVED = new Set(("break case catch class const continue debugger default delete do else enum export extends false finally for " +
  "function if implements import in instanceof interface let new null package private protected public return static super switch " +
  "this throw true try typeof var void while with yield await async of get set arguments eval undefined NaN Infinity").split(" "));

// 0 → "a", 53 → "$", 54 → "aa", … ; three-letter names start with "_" so they can never match a browser global such as "top"
function nameAt(k){
  if (k < FIRST.length) return FIRST[k];
  k -= FIRST.length;
  if (k < FIRST.length * NEXT.length) return FIRST[Math.floor(k / NEXT.length)] + NEXT[k % NEXT.length];
  k -= FIRST.length * NEXT.length;
  return "_" + NEXT[Math.floor(k / NEXT.length) % NEXT.length] + NEXT[k % NEXT.length] + (k >= NEXT.length * NEXT.length ? Math.floor(k / NEXT.length / NEXT.length) : "");
}

function shortenWithParser(code, acorn){
  const ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "script" });
  const first = ast.body[0];
  if (!(first && first.directive === "use strict")) throw new Error("the code does not start with \"use strict\"");

  class Scope {
    constructor(parent, isFunction){
      this.parent = parent; this.isFunction = isFunction;
      this.bindings = new Map();       // name → binding declared here
      this.children = [];
      this.usedOuter = new Set();      // outer bindings referenced somewhere inside this scope
      this.usedGlobals = new Set();    // undeclared names referenced somewhere inside this scope
      if (parent) parent.children.push(this);
    }
    get functionScope(){ let s = this; while (!s.isFunction) s = s.parent; return s; }
  }
  const root = new Scope(null, true);
  const refs = [];                       // { id, scope, shorthand }
  const shorthand = new Set();           // identifiers written as { name } that must become { name: x }
  const constDecls = [];                 // const declarations, written "let" if no constant is reassigned

  const declare = (scope, id, short, kind) => {
    let b = scope.bindings.get(id.name);
    if (!b) scope.bindings.set(id.name, b = { name: id.name, scope, ids: [], kind });
    b.ids.push(id);
    if (short) shorthand.add(id);
  };
  // binding patterns: let { a, b: [c] = [] } = …
  function pattern(p, declScope, exprScope, short, kind){
    if (!p) return;
    switch (p.type){
      case "Identifier": declare(declScope, p, short, kind); break;
      case "ObjectPattern":
        for (const prop of p.properties){
          if (prop.type === "RestElement") pattern(prop.argument, declScope, exprScope, false, kind);
          else { if (prop.computed) visit(prop.key, exprScope); pattern(prop.value, declScope, exprScope, prop.shorthand, kind); }
        }
        break;
      case "ArrayPattern": p.elements.forEach(e => pattern(e, declScope, exprScope, false, kind)); break;
      case "AssignmentPattern": pattern(p.left, declScope, exprScope, short, kind); visit(p.right, exprScope); break;
      case "RestElement": pattern(p.argument, declScope, exprScope, false, kind); break;
      default: throw new Error("unexpected pattern " + p.type);
    }
  }
  // assignment targets: x = …, x++, [a, b] = …, for (x of …)
  function target(n, s){
    switch (n.type){
      case "Identifier": refs.push({ id: n, scope: s, write: true }); return;
      case "ObjectPattern":
        for (const prop of n.properties){
          if (prop.type === "RestElement"){ target(prop.argument, s); continue; }
          if (prop.computed) visit(prop.key, s);
          const v = prop.value;
          if (prop.shorthand){
            const id = v.type === "AssignmentPattern" ? v.left : v;
            refs.push({ id, scope: s, write: true }); shorthand.add(id);
            if (v.type === "AssignmentPattern") visit(v.right, s);
          } else target(v, s);
        }
        return;
      case "ArrayPattern": n.elements.forEach(e => e && target(e, s)); return;
      case "AssignmentPattern": target(n.left, s); visit(n.right, s); return;
      case "RestElement": target(n.argument, s); return;
      default: visit(n, s);                                   // obj.prop = …
    }
  }
  function fn(n, outer){
    const s = new Scope(outer, true);
    if (n.type === "FunctionExpression" && n.id) declare(s, n.id);
    n.params.forEach(p => pattern(p, s, s));
    if (n.body.type === "BlockStatement") n.body.body.forEach(x => visit(x, s));
    else visit(n.body, s);
  }
  function visit(n, s){
    if (!n || typeof n.type !== "string") return;
    switch (n.type){
      case "Identifier": refs.push({ id: n, scope: s }); return;
      case "FunctionDeclaration": declare(s, n.id); fn(n, s); return;     // strict mode: scoped to its block
      case "FunctionExpression": case "ArrowFunctionExpression": fn(n, s); return;
      case "ClassDeclaration": declare(s, n.id); visit(n.superClass, s); visit(n.body, s); return;
      case "ClassExpression": {
        const c = n.id ? new Scope(s, false) : s;
        if (n.id) declare(c, n.id);
        visit(n.superClass, c); visit(n.body, c); return;
      }
      case "VariableDeclaration":
        for (const d of n.declarations){ pattern(d.id, n.kind === "var" ? s.functionScope : s, s, false, n.kind); visit(d.init, s); }
        if (n.kind === "const") constDecls.push(n);
        return;
      case "AssignmentExpression": target(n.left, s); visit(n.right, s); return;
      case "UpdateExpression": target(n.argument, s); return;
      case "BlockStatement": { const b = new Scope(s, false); n.body.forEach(x => visit(x, b)); return; }
      case "StaticBlock": { const b = new Scope(s, true); n.body.forEach(x => visit(x, b)); return; }
      case "ForStatement": case "ForInStatement": case "ForOfStatement": {
        const f = new Scope(s, false);
        if (n.left && n.left.type !== "VariableDeclaration") target(n.left, f);
        for (const k of ["init", n.left && n.left.type === "VariableDeclaration" ? "left" : "", "right", "test", "update", "body"]) visit(n[k], f);
        return;
      }
      case "CatchClause": {
        const c = new Scope(s, false);
        if (n.param) pattern(n.param, c, c);
        n.body.body.forEach(x => visit(x, c)); return;
      }
      case "SwitchStatement": {
        visit(n.discriminant, s);
        const w = new Scope(s, false);
        for (const c of n.cases){ visit(c.test, w); c.consequent.forEach(x => visit(x, w)); }
        return;
      }
      case "MemberExpression": visit(n.object, s); if (n.computed) visit(n.property, s); return;
      case "Property":
        if (n.computed) visit(n.key, s);
        if (n.shorthand){                                       // { a } or, as an assignment target, { a = 1 }
          const v = n.value, id = v.type === "AssignmentPattern" ? v.left : v;
          if (id.type === "Identifier"){ refs.push({ id, scope: s }); shorthand.add(id); }
          if (v.type === "AssignmentPattern") visit(v.right, s);
        } else visit(n.value, s);
        return;
      case "MethodDefinition": case "PropertyDefinition":
        if (n.computed) visit(n.key, s);
        visit(n.value, s); return;
      case "LabeledStatement": visit(n.body, s); return;
      case "BreakStatement": case "ContinueStatement": case "MetaProperty": case "PrivateIdentifier": return;
      case "CallExpression":
        if (n.callee.type === "Identifier" && n.callee.name === "eval") throw new Error("eval() is used");
        break;
    }
    for (const k in n){
      if (k === "type" || k === "start" || k === "end") continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(x => visit(x, s));
      else if (v && typeof v === "object") visit(v, s);
    }
  }
  ast.body.forEach(x => visit(x, root));

  // Resolve every reference to its declaration (or to an undeclared global).
  let constAssigned = false;
  for (const { id, scope, write } of refs){
    let s = scope;
    while (s && !s.bindings.has(id.name)) s = s.parent;
    if (s){
      const b = s.bindings.get(id.name);
      b.ids.push(id);
      if (write && b.kind === "const") constAssigned = true;
      for (let u = scope; u !== s; u = u.parent) u.usedOuter.add(b);
    } else {
      for (let u = scope; u; u = u.parent) u.usedGlobals.add(id.name);
    }
  }

  // Name scopes from the outside in.
  (function assign(s){
    const taken = new Set([...s.usedGlobals]);
    for (const b of s.usedOuter) taken.add(b.short);
    const list = [...s.bindings.values()].sort((a, b) => b.ids.length - a.ids.length);
    let k = 0;
    for (const b of list){
      let name;
      do name = nameAt(k++); while (taken.has(name) || RESERVED.has(name));
      b.short = name; taken.add(name);
    }
    s.children.forEach(assign);
  })(root);

  // Write the new names into the code.
  const edits = [];
  (function collect(s){
    for (const b of s.bindings.values()){
      if (b.short === b.name) continue;
      for (const id of b.ids) edits.push({ start: id.start, end: id.end, text: shorthand.has(id) ? `${b.name}:${b.short}` : b.short });
    }
    s.children.forEach(collect);
  })(root);
  if (!constAssigned) for (const d of constDecls) edits.push({ start: d.start, end: d.start + 5, text: "let" });
  for (const st of ast.body.slice(1))
    if (st.type === "ExpressionStatement" && st.expression.type === "Literal" && st.expression.value === "use strict") edits.push({ start: st.start, end: st.end, text: "" });
  edits.sort((a, b) => a.start - b.start);
  let out = "", at = 0;
  for (const e of edits){
    if (e.start < at) throw new Error("overlapping renames at " + e.start);
    out += code.slice(at, e.start) + e.text; at = e.end;
  }
  out += code.slice(at);
  acorn.parse(out, { ecmaVersion: "latest", sourceType: "script" });     // the result must still be valid JavaScript
  return out;
}

// Returns { code } or { error }.
function shortenNames(code){
  const { spawnSync } = require("child_process");
  const r = spawnSync(process.execPath, ["--expose-internals", __filename, "--shorten-names"], { input: code, encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status === 0 && r.stdout) return { code: r.stdout };
  const msg = (r.error && r.error.message) || (r.stderr || "").split("\n").find(l => /^\w*Error\b/.test(l)) || "unknown error";
  return { error: msg.trim() };
}

if (require.main === module && process.argv[2] === "--shorten-names"){
  const acorn = require("internal/deps/acorn/acorn/dist/acorn");
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", d => { input += d; });
  process.stdin.on("end", () => { process.stdout.write(shortenWithParser(input, acorn)); });
}

module.exports = { minifyJS, minifyCSS, shortenNames };
