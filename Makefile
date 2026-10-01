.PHONY: check api-test web-check dev-infra
check: api-test web-check
api-test:
	cd apps/api && ./mvnw test
web-check:
	cd apps/web && npm run check
dev-infra:
	docker compose up -d postgres redis
