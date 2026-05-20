# SaludDeUna Web — Makefile
# Requiere bash y AWS CloudShell para los targets de deploy.
# Para desarrollo local: targets de dev/build/test/lint funcionan sin AWS.

.PHONY: help dev build test lint types deploy redeploy verify destroy logs

help:
	@echo "SaludDeUna Web — Comandos disponibles:"
	@echo ""
	@echo "  Desarrollo local:"
	@echo "    make dev        Iniciar servidor de desarrollo (puerto 3001)"
	@echo "    make build      Build de produccion Next.js"
	@echo "    make types      Regenerar tipos desde openapi.json"
	@echo "    make test       Tests unitarios"
	@echo "    make lint       Linter"
	@echo "    make typecheck  TypeScript type check"
	@echo ""
	@echo "  AWS CloudShell (desde el directorio del repo):"
	@echo "    make deploy     Deploy completo (requiere backend desplegado)"
	@echo "    make redeploy   Solo rebuild y redeploy imagen"
	@echo "    make verify     Health check de la app web"
	@echo "    make logs       Ver logs en tiempo real"

dev:
	npm run dev

build:
	npm run build

types:
	npm run generate:api-types

test:
	npm run test -- --ci --runInBand

lint:
	npm run check:lint

typecheck:
	npm run check:types

deploy:
	@bash deploy/deploy.sh

redeploy:
	@bash deploy/deploy.sh --only-build

verify:
	@bash deploy/scripts/05-verify.sh

logs:
	@REGION=$$(cat $$HOME/.sduna-web-region 2>/dev/null || echo "us-east-1"); \
	 aws logs tail /ecs/salud-de-una/dev/web --follow --region $$REGION
