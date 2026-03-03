#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const HOME = process.env.HOME || process.env.USERPROFILE || ''
const SOURCE_DIR = path.join(__dirname, '..', 'skills-contraktor')

function parseArgs() {
	const a = process.argv.slice(2)
	const flags = {
		help: false,
		cursor: false,
		claude: false,
		gemini: false,
		codex: false,
		kiro: false,
		antigravity: false,
		opencode: false,
		adal: false,
		all: false,
	}

	for (let i = 0; i < a.length; i++) {
		if (a[i] === '--help' || a[i] === '-h') {
			flags.help = true
			continue
		}
		if (a[i] === '--all') {
			flags.all = true
			continue
		}
		if (a[i] === '--cursor') {
			flags.cursor = true
			continue
		}
		if (a[i] === '--claude') {
			flags.claude = true
			continue
		}
		if (a[i] === '--gemini') {
			flags.gemini = true
			continue
		}
		if (a[i] === '--codex') {
			flags.codex = true
			continue
		}
		if (a[i] === '--kiro') {
			flags.kiro = true
			continue
		}
		if (a[i] === '--antigravity') {
			flags.antigravity = true
			continue
		}
		if (a[i] === '--opencode') {
			flags.opencode = true
			continue
		}
		if (a[i] === '--adal') {
			flags.adal = true
			continue
		}
	}

	return flags
}

function getTargets(flags) {
	const targets = []

	if (flags.all) {
		targets.push({ name: 'Cursor', path: path.join(HOME, '.cursor', 'skills') })
		targets.push({ name: 'Claude Code', path: path.join(HOME, '.claude', 'skills') })
		targets.push({ name: 'Gemini CLI', path: path.join(HOME, '.gemini', 'skills') })
		const codexHome = process.env.CODEX_HOME
		targets.push({
			name: 'Codex CLI',
			path: codexHome ? path.join(codexHome, 'skills') : path.join(HOME, '.codex', 'skills'),
		})
		targets.push({ name: 'Kiro', path: path.join(HOME, '.kiro', 'skills') })
		targets.push({ name: 'Antigravity', path: path.join(HOME, '.gemini', 'antigravity', 'skills') })
		targets.push({ name: 'OpenCode', path: path.join(HOME, '.agents', 'skills') })
		targets.push({ name: 'AdaL CLI', path: path.join(HOME, '.adal', 'skills') })
		return targets
	}

	if (flags.cursor) {
		targets.push({ name: 'Cursor', path: path.join(HOME, '.cursor', 'skills') })
	}
	if (flags.claude) {
		targets.push({ name: 'Claude Code', path: path.join(HOME, '.claude', 'skills') })
	}
	if (flags.gemini) {
		targets.push({ name: 'Gemini CLI', path: path.join(HOME, '.gemini', 'skills') })
	}
	if (flags.codex) {
		const codexHome = process.env.CODEX_HOME
		targets.push({
			name: 'Codex CLI',
			path: codexHome ? path.join(codexHome, 'skills') : path.join(HOME, '.codex', 'skills'),
		})
	}
	if (flags.kiro) {
		targets.push({ name: 'Kiro', path: path.join(HOME, '.kiro', 'skills') })
	}
	if (flags.antigravity) {
		targets.push({ name: 'Antigravity', path: path.join(HOME, '.gemini', 'antigravity', 'skills') })
	}
	if (flags.opencode) {
		targets.push({ name: 'OpenCode', path: path.join(HOME, '.agents', 'skills') })
	}
	if (flags.adal) {
		targets.push({ name: 'AdaL CLI', path: path.join(HOME, '.adal', 'skills') })
	}

	if (targets.length === 0) {
		targets.push({ name: 'Cursor', path: path.join(HOME, '.cursor', 'skills') })
	}

	return targets
}

function copyRecursiveSync(src, dest, skipGit = true) {
	const stats = fs.statSync(src)
	if (stats.isDirectory()) {
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true })
		}
		fs.readdirSync(src).forEach((child) => {
			if (skipGit && child === '.git') return
			copyRecursiveSync(path.join(src, child), path.join(dest, child), skipGit)
		})
	} else {
		fs.copyFileSync(src, dest)
	}
}

function installSkillsIntoTarget(sourceDir, targetPath) {
	const entries = fs.readdirSync(sourceDir)
	let count = 0
	for (const name of entries) {
		const src = path.join(sourceDir, name)
		const stat = fs.statSync(src)
		if (!stat.isDirectory() && name.startsWith('.')) continue
		const dest = path.join(targetPath, name)
		copyRecursiveSync(src, dest)
		if (stat.isDirectory()) count++
	}
	return count
}

function printHelp() {
	console.log(`
deploy-contraktor-skills — copia skills de skills-contraktor/ para pastas globais dos IDEs

  npm run deploy:contraktor [-- options]

  Sem opções: instala apenas em Cursor (~/.cursor/skills).

Options:
  --cursor       Copiar para ~/.cursor/skills (Cursor)
  --claude       Copiar para ~/.claude/skills (Claude Code)
  --gemini       Copiar para ~/.gemini/skills (Gemini CLI)
  --codex        Copiar para $CODEX_HOME/skills ou ~/.codex/skills (Codex CLI)
  --kiro         Copiar para ~/.kiro/skills (Kiro)
  --antigravity  Copiar para ~/.gemini/antigravity/skills (Antigravity)
  --opencode     Copiar para ~/.agents/skills (OpenCode)
  --adal         Copiar para ~/.adal/skills (AdaL CLI)
  --all          Copiar para todos os IDEs acima
  --help, -h     Mostrar esta ajuda

Examples:
  npm run deploy:contraktor -> copia apenas para o Cursor (~/.cursor/skills)
  npm run deploy:contraktor -- --all -> copia para todos os IDEs acima
  npm run deploy:contraktor -- --cursor --claude --gemini -> copia para o Cursor (~/.cursor/skills), Claude Code (~/.claude/skills), e Gemini CLI (~/.gemini/skills)
  npm run deploy:contraktor -- --help -> mostra esta ajuda
`)
}

function main() {
	const flags = parseArgs()

	if (flags.help) {
		printHelp()
		return
	}

	if (!HOME) {
		console.error('Não foi possível resolver o diretório home (HOME ou USERPROFILE).')
		process.exit(1)
	}

	if (!fs.existsSync(SOURCE_DIR)) {
		console.error(`Pasta de origem não encontrada: ${SOURCE_DIR}`)
		process.exit(1)
	}

	const entries = fs.readdirSync(SOURCE_DIR)
	const skillDirs = entries.filter((name) => {
		const full = path.join(SOURCE_DIR, name)
		return fs.statSync(full).isDirectory() && !name.startsWith('.')
	})

	if (skillDirs.length === 0) {
		console.error(`Nenhuma skill encontrada em: ${SOURCE_DIR}`)
		process.exit(1)
	}

	const targets = getTargets(flags)

	console.log(`\nDeploy de ${skillDirs.length} skills de skills-contraktor/ para ${targets.length} destino(s):\n`)

	for (const target of targets) {
		const targetPath = target.path
		const parent = path.dirname(targetPath)
		if (!fs.existsSync(parent)) {
			fs.mkdirSync(parent, { recursive: true })
		}
		if (!fs.existsSync(targetPath)) {
			fs.mkdirSync(targetPath, { recursive: true })
		}
		const count = installSkillsIntoTarget(SOURCE_DIR, targetPath)
		console.log(`  ${target.name}: ${targetPath}`)
		console.log(`  ✓ ${count} skills copiadas para ${targetPath}\n`)
	}
}

main()
