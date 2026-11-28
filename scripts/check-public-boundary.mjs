#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join, relative, sep } from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const QUIET = process.argv.includes('--quiet')

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.git',
  '.tools',
  'test-results',
  'playwright-report',
])
const TEXT_EXTS = new Set(['.ts', '.js', '.vue', '.md', '.json', '.yml', '.yaml', '.html', '.css'])
const PPT_EXTS = new Set(['.ppt', '.pptx', '.vsdx', '.vsd'])
const GOVERNANCE_FILES = new Set(['docs/PROJECT-STATE.md', '蓝图.md', 'AGENTS.md'])
const SENSITIVE_SCOPE_FILES = new Set([
  'docs/ASSETS.md',
  'docs/CONTENT-MAP.md',
  'docs/DELIVERY-V0.1.md',
  'README.md',
])
const SENSITIVE_SCOPE_PREFIXES = ['src/', 'e2e/', 'tests/']
const SENSITIVE_WHITELIST = new Set(['src/domain/contentValidation.ts', 'tests/content.test.ts'])
const IP_SCOPE_FILES = new Set(['README.md', 'docs/CONTENT-MAP.md', 'docs/DELIVERY-V0.1.md'])
const IP_SCOPE_PREFIXES = ['src/content/']
const TOKEN_WHITELIST = new Set(['scripts/check-public-boundary.mjs'])

const SENSITIVE_TERMS = [
  '贵州',
  '省直',
  '厅局',
  '省委',
  '省政府',
  '地州',
  '政务外网',
  '惠智',
  '奇安信',
  '深信服',
  '网御',
  '吉大',
  '国办',
  '信息中心',
  '附件4',
  '详细网络拓扑图',
]

const SVG_FORBIDDEN = [
  '<script',
  '<foreignobject',
  'onload=',
  'onerror=',
  'javascript:',
  'href="http',
  'xlink:href="http',
]

const TOKEN_PATTERNS = [
  { label: 'PRIVATE KEY 头', pattern: /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/ },
  { label: 'GitHub 经典令牌 ghp_', pattern: /ghp_[A-Za-z0-9]+/ },
  { label: 'GitHub 细粒度令牌 github_pat_', pattern: /github_pat_[A-Za-z0-9_]+/ },
  { label: 'AWS Access Key AKIA', pattern: /AKIA[0-9A-Z]{16}/ },
  { label: 'Slack 令牌 xox', pattern: /xox[baprs]-[A-Za-z0-9-]+/ },
]

const IPV4 = /(?<![\d.])(\d{1,3}(?:\.\d{1,3}){3})(?![\d.])/g

const violations = []
const stats = { files: 0, source: 'fs', sensitive: 0, ip: 0, svg: 0, token: 0, path: 0 }

function normalize(filePath) {
  return filePath.split(sep).join('/')
}

function listFromGit() {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.split('\0').filter(Boolean).map(normalize)
  } catch {
    return null
  }
}

function walk(dir, acc) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      walk(join(dir, entry.name), acc)
    } else if (entry.isFile()) {
      acc.push(normalize(relative(ROOT, join(dir, entry.name))))
    }
  }
}

function discoverFiles() {
  const tracked = listFromGit()
  const found = []
  walk(ROOT, found)
  if (tracked && tracked.length > 0) {
    const merged = new Set([...tracked, ...found])
    stats.source = merged.size > tracked.length ? 'git+filesystem' : 'git'
    return [...merged].sort()
  }
  stats.source = 'filesystem'
  return found.sort()
}

function isTextFile(file) {
  const ext = extname(file).toLowerCase()
  if (!TEXT_EXTS.has(ext)) return false
  if (basename(file) === 'package-lock.json') return false
  return true
}

function isReferencePath(file) {
  return file === '参考' || file.startsWith('参考/') || file.includes('/参考/')
}

function isGovernance(file) {
  return GOVERNANCE_FILES.has(file)
}

function inSensitiveScope(file) {
  if (isGovernance(file) || isReferencePath(file)) return false
  if (SENSITIVE_WHITELIST.has(file)) return false
  if (SENSITIVE_SCOPE_FILES.has(file)) return true
  return SENSITIVE_SCOPE_PREFIXES.some((prefix) => file.startsWith(prefix))
}

function inIpScope(file) {
  if (isGovernance(file) || isReferencePath(file)) return false
  if (IP_SCOPE_FILES.has(file)) return true
  return IP_SCOPE_PREFIXES.some((prefix) => file.startsWith(prefix))
}

function readText(file) {
  try {
    return readFileSync(join(ROOT, file), 'utf8')
  } catch {
    return null
  }
}

function addViolation(file, line, kind, message) {
  violations.push({ file, line, kind, message })
  stats[kind] += 1
}

function checkForbiddenPaths(files) {
  for (const file of files) {
    if (isReferencePath(file)) {
      addViolation(file, 0, 'path', '禁止入库的参考素材路径：参考/')
      continue
    }
    const ext = extname(file).toLowerCase()
    if (PPT_EXTS.has(ext) && (file.includes('最全网') || file.includes('VISIO图标集'))) {
      addViolation(file, 0, 'path', '禁止入库的资料型 PPT/VSD 文件')
    }
  }
}

function checkSensitiveTerms(files) {
  for (const file of files) {
    if (!isTextFile(file) || !inSensitiveScope(file)) continue
    const content = readText(file)
    if (content === null) continue
    content.split(/\r?\n/).forEach((line, index) => {
      for (const term of SENSITIVE_TERMS) {
        if (line.includes(term)) {
          addViolation(file, index + 1, 'sensitive', `敏感词：${term}`)
        }
      }
    })
  }
}

function isPrivateIpv4(ip) {
  if (ip === '127.0.0.1') return false
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(ip) ||
    /^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip) ||
    ip.startsWith('127.') ||
    ip.startsWith('169.254.') ||
    ip === '0.0.0.0'
  )
}

function isAllowedWildcard(line, index, ip) {
  if (ip !== '0.0.0.0') return false
  if (/0\.0\.0\.0[ \t]+0\.0\.0\.0/.test(line)) return true
  const after = line.slice(index + ip.length)
  if (after.startsWith('/0')) return true
  if (after.startsWith(' 0.0.0.0')) return true
  return false
}

function checkPrivateIps(files) {
  for (const file of files) {
    if (!isTextFile(file) || !inIpScope(file)) continue
    const content = readText(file)
    if (content === null) continue
    content.split(/\r?\n/).forEach((line, lineIndex) => {
      IPV4.lastIndex = 0
      let match
      while ((match = IPV4.exec(line)) !== null) {
        const ip = match[1]
        if (!isPrivateIpv4(ip)) continue
        if (isAllowedWildcard(line, match.index, ip)) continue
        addViolation(file, lineIndex + 1, 'ip', `私有/保留 IPv4：${ip}`)
      }
    })
  }
}

function checkSvg(files) {
  for (const file of files) {
    if (!file.startsWith('src/assets/') || !file.toLowerCase().endsWith('.svg')) continue
    const content = readText(file)
    if (content === null) continue
    content.split(/\r?\n/).forEach((line, index) => {
      const lower = line.toLowerCase()
      for (const token of SVG_FORBIDDEN) {
        if (lower.includes(token)) {
          addViolation(file, index + 1, 'svg', `SVG 禁止内容：${token}`)
        }
      }
    })
  }
}

function checkTokens(files) {
  for (const file of files) {
    if (!isTextFile(file)) continue
    if (isGovernance(file) || isReferencePath(file) || TOKEN_WHITELIST.has(file)) continue
    const content = readText(file)
    if (content === null) continue
    content.split(/\r?\n/).forEach((line, index) => {
      for (const { label, pattern } of TOKEN_PATTERNS) {
        if (pattern.test(line)) {
          addViolation(file, index + 1, 'token', `疑似凭据：${label}`)
        }
      }
    })
  }
}

function report() {
  const fileCount = stats.files
  if (violations.length === 0) {
    if (!QUIET) {
      console.log(`[PASS] 公共边界检查通过：已扫描 ${fileCount} 个文件（来源：${stats.source}）`)
      console.log(
        `       敏感词 ${stats.sensitive} 项 / 私有IP ${stats.ip} 项 / SVG ${stats.svg} 项 / 凭据 ${stats.token} 项 / 路径 ${stats.path} 项`,
      )
    } else {
      console.log('[PASS] 公共边界检查通过')
    }
    return 0
  }

  violations.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)))
  console.log(`[FAIL] 公共边界检查失败：共 ${violations.length} 项`)
  for (const item of violations) {
    const location = item.line > 0 ? `${item.file}:${item.line}` : item.file
    console.log(`  - [${item.kind}] ${location} ${item.message}`)
  }
  return 1
}

const files = discoverFiles()
stats.files = files.length

checkForbiddenPaths(files)
checkSensitiveTerms(files)
checkPrivateIps(files)
checkSvg(files)
checkTokens(files)

process.exitCode = report()