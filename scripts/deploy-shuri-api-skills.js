#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const SOURCE_DIR = path.join(__dirname, '..', 'skills-contraktor-shuri-api')

function parseArgs() {
	const a = process.argv.slice(2)
	let basePath = null
	let help = false

	for (let i = 0; i < a.length; i++) {
		if (a[i] === '--help' || a[i] === '-h') {
			help = true
			continue
		}
		if (a[i].startsWith('--')) continue
		basePath = a[i]
		break
	}

	return { basePath, help }
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
deploy-shuri-api-skills — copia skills de skills-contraktor-shuri-api/ para <basePath>/.cursor/skills/

  npm run deploy:shuri-api -- <basePath>

  basePath: caminho da raiz do projeto de destino (ex.: /opt/projetos/shuri/shuri-api).
  As skills serão copiadas para <basePath>/.cursor/skills/

Options:
  --help, -h     Mostrar esta ajuda

Example:
  npm run deploy:shuri-api -- /opt/projetos/shuri/shuri-api
`)
}

function main() {
	const { basePath, help } = parseArgs()

	if (help) {
		printHelp()
		return
	}

	if (!basePath) {
		console.error('Erro: informe o caminho base do projeto (basePath).')
		console.error('Uso: npm run deploy:shuri-api -- <basePath>')
		console.error('Ex.: npm run deploy:shuri-api -- /opt/projetos/shuri/shuri-api')
		process.exit(1)
	}

	const destPath = path.resolve(basePath)
	if (!fs.existsSync(destPath)) {
		console.error(`Erro: o caminho base não existe: ${destPath}`)
		process.exit(1)
	}

	const targetPath = path.join(destPath, '.cursor', 'skills')

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

	if (!fs.existsSync(targetPath)) {
		fs.mkdirSync(targetPath, { recursive: true })
	}

	const count = installSkillsIntoTarget(SOURCE_DIR, targetPath)

	console.log(`\nDeploy de ${skillDirs.length} skills para ${targetPath}`)
	console.log(`  ✓ ${count} skills copiadas para ${targetPath}\n`)
}

main()
