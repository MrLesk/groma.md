---
id: TASK-541
title: Store outgoing relationships with their source elements
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 04:33'
updated_date: '2026-10-05 04:48'
labels: []
dependencies: []
references:
  - relationship-markdown
  - src-architecture-model
  - src-architecture-reader
  - src-core
  - scan-evidence
  - src-scanner
  - curate
  - src-authoring
  - instructions
modified_files:
  - src/relationship-markdown.ts
  - src/relationship-storage.ts
  - src/okf-profile.ts
  - src/architecture-reader.ts
  - src/architecture-model.ts
  - src/plain-world.ts
  - test-bun/rename.test.ts
  - test-bun/system-curation.test.ts
  - src/types.ts
  - src/relation.ts
  - src/relationship-inference.ts
  - src/scan-reconciler.ts
  - src/curate.ts
  - src/movable.ts
  - src/remove.ts
  - test/fixtures/validate/groma/actors/buyer.md
  - test/fixtures/validate/groma/systems/shop/system.md
  - test/fixtures/validate/groma/relationships.md
  - test/fixtures/plain-view/groma/actors/buyer.md
  - >-
    test/fixtures/plain-view/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/plain-view/groma/relationships.md
  - test/fixtures/openclaw-view/groma/actors/operator.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/agent-runtime/container.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/channels/container.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/cli/components/cli-implementation.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/control-ui/components/control-ui-implementation.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/gateway/components/gateway-implementation.md
  - >-
    test/fixtures/openclaw-view/groma/systems/openclaw/containers/node/components/node-implementation.md
  - test/fixtures/openclaw-view/groma/relationships.md
  - >-
    test/fixtures/containers-view/groma/systems/shop/containers/web/components/page.md
  - test/fixtures/containers-view/groma/relationships.md
  - test/fixtures/viewer-view/groma/actors/shop-architect.md
  - test/fixtures/viewer-view/groma/actors/shop-operator.md
  - >-
    test/fixtures/viewer-view/groma/systems/shop/containers/api/components/orders.md
  - >-
    test/fixtures/viewer-view/groma/systems/shop/containers/gateway/components/router.md
  - >-
    test/fixtures/viewer-view/groma/systems/shop/containers/stock-viewer/components/stock-page.md
  - test/fixtures/viewer-view/groma/systems/shop/system.md
  - test/fixtures/viewer-view/groma/relationships.md
  - test/fixtures/large-world/groma/actors/merchant.md
  - test/fixtures/large-world/groma/actors/shopper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-client.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-writer.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-config.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-logger.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-router.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-session.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-validator.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-worker.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-client.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-writer.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-cache.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-config.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-logger.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-router.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-session.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-validator.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-worker.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-client.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-writer.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-cache.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-config.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-logger.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-router.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-session.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-validator.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-worker.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-client.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-writer.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-cache.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-config.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-logger.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-metrics.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-scheduler.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-writer.md
  - test/fixtures/large-world/groma/relationships.md
  - test/fixtures/edit/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/edit/groma/relationships.md
  - >-
    test/fixtures/core-view/groma/systems/shop/containers/api/components/inventory.md
  - >-
    test/fixtures/core-view/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/core-view/groma/relationships.md
  - >-
    test/fixtures/relationship-pairs/groma/systems/site/containers/pages/components/talks.md
  - >-
    test/fixtures/relationship-pairs/groma/systems/site/containers/pages/components/speakers.md
  - >-
    test/fixtures/relationship-pairs/groma/systems/backend/containers/api/components/sessions.md
  - test/fixtures/relationship-pairs/groma/relationships.md
  - test/fixtures/flows/groma/actors/requester.md
  - test/fixtures/flows/groma/systems/service/containers/api/components/entry.md
  - >-
    test/fixtures/flows/groma/systems/service/containers/api/components/worker.md
  - test/fixtures/flows/groma/relationships.md
  - src/curate-rename.ts
  - test/architecture-model-helpers.ts
  - test/architecture-model.test.ts
  - test/architecture-model-errors.test.ts
  - test-bun/flows.test.ts
  - test-bun/http-relationships.test.ts
  - test-bun/detach.test.ts
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/agent-instructions/relationships.md
  - src/instructions.ts
  - src/markdown-emitter.ts
  - groma/systems/groma-md/containers/cli/components/relationship-storage.md
  - groma/relationships.md
  - groma/systems/groma-md/containers/cli/components/src-cli.md
  - groma/systems/groma-md/containers/cli/components/src-scanner.md
  - groma/systems/groma-md/containers/cli/components/scanner-session.md
  - groma/systems/groma-md/containers/export/components/data.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - groma/systems/groma-md/containers/cli/components/src-view-host.md
  - groma/systems/groma-md/containers/cli/components/web-page.md
  - groma/systems/groma-md/containers/cli/components/csharp-src-index.md
  - groma/systems/groma-md/containers/csharp-worker/components/csharp-command.md
  - groma/systems/groma-md/containers/cli/components/go-src-index.md
  - groma/systems/groma-md/containers/cli/components/rust-src-index.md
  - groma/actors/developer.md
  - groma/systems/groma-md/containers/cli/components/backlog-src-index.md
  - groma/systems/groma-md/containers/cli/components/history-revisions.md
  - groma/systems/groma-md/containers/cli/components/package.md
  - groma/systems/groma-md/containers/cli/components/src-authoring.md
  - groma/systems/groma-md/containers/export/components/task-diff-control.md
  - groma/systems/groma-md/containers/export/components/revision-control.md
  - groma/actors/coding-agent.md
  - groma/systems/groma-md/containers/cli/components/web-export.md
  - groma/systems/groma-md/containers/export/components/render.md
  - groma/systems/groma-md/containers/cli/components/scanner-source-watch.md
  - groma/systems/groma-md/containers/cli/components/screen.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-watch.md
  - groma/systems/groma-md/containers/cli/components/src-initialize.md
  - groma/systems/groma-md/containers/export/components/button.md
  - groma/systems/groma-md/containers/export/components/camera.md
  - groma/systems/groma-md/containers/export/components/review-control.md
  - groma/systems/groma-md/containers/export/components/search-control.md
  - groma/systems/groma-md/containers/export/components/source-control.md
  - groma/systems/groma-md/containers/cli/components/relationship-markdown.md
  - groma/index.md
  - AGENTS.md
  - test-bun/source-relationships.test.ts
type: enhancement
ordinal: 626000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Architecture readers need each element and its outgoing interactions together. Alex approved replacing the central relationships document with ordinary Markdown tables in the source element, retaining exact file endpoints, temporary storage after detach, and reassignment on the next scan. Scanning should check ownership in one pass and write only changed relationship documents. This replaces the prototype format directly; no compatibility reader or migration is requested.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Authored, draft, and derived relationships are stored in source element documents; CLI and map behavior retain their meaning and exact endpoints, including actor and external-system declarations.
- [x] #2 Detach preserves stored relationships until a scan assigns a source owner; scan and combine transfer rows without loss or duplication, and document moves and renames preserve links.
- [x] #3 Unchanged scans do not rewrite relationship documents; absent scanner evidence and authored precedence retain existing behavior.
- [x] #4 The central relationships concept and obsolete prototype fixtures are replaced, and the storage contract and user guides describe the final design.
- [x] #5 Focused tests, the repository check, required reviews, and isolated validation against other Groma repositories under ~/projects have recorded results.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Keep the existing four-column Markdown tables and lifecycle sections on C4 element documents. A stored row retains its source document only in memory; exact file/concept endpoints determine ownership. Remove the central supporting concept. This is a Groma profile change: ordinary OKF readers retain links and claims, and C4 elements and interactions retain their meaning.
2. Centralize relationship placement and text updates in the relationship storage responsibility. Scan computes current owners, retains authored and unavailable-scanner claims, and writes only documents whose rows changed. Detached source rows stay in the old document until ownership returns. Curation carries rows through combine and rebases links through moves and renames. Preserve existing flow restrictions.
3. Replace prototype fixtures and required live prototype relationship state without a compatibility reader, migration command, or new persisted metadata. Update the contract and guides.
4. Extend existing detach coverage to prove authored and derived rows physically follow their source file after scan and combine, including an unrelated unchanged document. Authority: the approved detach and efficient scan behavior; current tests only verify the projected map. Extend existing scan coverage with modification times to detect unnecessary relationship writes; existing tests compare only content/model. Existing relation lifecycle, HTTP, partial-scan, rename, curation, removal, flow and fixture tests cover the unchanged semantics.
5. Run focused checks, one cold simplicity review without conversation history, then own specification and quality reviews, one final full-context complexity review, and bun run check. Test actual scanners and relationship detach/scan/combine in isolated copies of other Groma projects under ~/projects; record repository versions, sizes, timing, and limitations.

6. Final complexity review reproduced a supported removal regression against AC #2: after detaching every file, deleting the empty former owner erased its waiting authored row before a rescan. Refuse removal while its document holds rows sourced by detached files and direct the user to scan first. Extend the existing detach lifecycle scenario to attempt that removal before scan and verify the row still returns; existing coverage never removed the empty waiting owner.

7. The same final review reproduced Markdown corruption: a fenced overview example containing a Relationships heading was mistaken for a real storage section, so authoring removed its closing fence and lost the new claim. Preserve fenced content when finding section boundaries. Extend the existing derived-to-authored lifecycle test with that literal example and assert both preservation and the authored claim; existing tests covered ordinary prose only.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cold simplicity review completed by a separate agent without conversation history. No blocking finding. Accepted consolidation: render each relationship lifecycle table once in relationship-storage and delete the unused old append/remove table machinery. Extended the existing source-unit detach scenario to verify physical derived-row transfer and its unchanged-scan modification time, closing the plan evidence gap without a new fixture.

Implementer specification review: the CLI writes authored/draft rows into the source element, scans refresh derived rows and relocate authored/retained rows by exact file ownership, combine carries rows, moves/renames rebase links, and lifecycle/flow restrictions remain covered. The central concept/type/parser exception and all 10 old fixture relationship records were removed; 323 fixture paths redistribute existing claims, including the large map. The live prototype was recreated through relation commands and a scan after removing its scoped obsolete record; the new source module was combined into relationship-markdown.
Implementer quality review: traced CLI -> relation -> storedRelationships -> placement/diff -> validated changed document writes; scan follows the same storage responsibility after reconciliation. Row grouping and rendering are linear; no-op scans issue no relationship writes. Exact endpoint and map identity remain independent of document storage. The new module belongs to the existing Architecture relationships component. No changed function has a complexity warning; files remain at most 500 lines. Existing regressions now inspect authored and derived physical storage and modification times; they retain domain assertions and parallel isolation. No authority-backed blocker found.
Required check passed: TypeScript and lint (only existing unrelated warnings), Node 16 pass, Bun 758 pass / 48 skip / 0 fail (806 tests in 140 files, 69.42 seconds). Focused checks after the cold simplification: 126 pass, 0 fail. Logs are under /private/tmp/groma-task-541.

External-repository qualification used disposable source copies; original repositories were not changed. Each run used the actual local scanner, an unchanged second scan with modification-time checks across every element document, and an explicitly labelled temporary authored claim through combine -> detach -> scan -> combine. Backlog.md at 69e7b15362337d6712783d9a685f6e4bb693fa9d: TypeScript, 213 components, 7 derived rows; unchanged scan 0.92s, zero rewrites. mise at 2ee0125e1500dacdf68d1249d31178836f03724c: TypeScript, 381 components, 10 derived rows; 0.87s, zero rewrites. Its ignored generated Nuxt tsconfig files were copied from the original checkout after the isolated tracked-file copy lacked them; no product changes were made for this. Keycloak at dd4ae31d1b67c91a7f85f7c60df5c9718b111f0a: Java, 5417 components, no derived rows; 10.94s, zero rewrites, authored transfer passed. The Java scanner reported 12835 incomplete-type/build diagnostics; these qualify source ownership/storage, not complete runtime interaction inference. openclaw at 635c78a1778d59fbb125d0afef481bc462d7ebc7: TypeScript, 3054 components, 272 derived rows; 20.02s, zero rewrites. All four transfer cycles passed. Detailed JSON reports and logs: /private/tmp/groma-task-541.
Live prototype verification: 121 elements, all 42 original authored claims preserved exactly, 21 derived claims, six flows resolve, every row is stored with its current source owner, obsolete central record absent, relationship-storage.ts owned by relationship-markdown. groma init regenerated the root index; its unrelated AGENTS.md template refresh was reverted. git diff --check passes.

Full-context review blocker: the new local storage made removeThing erase detached-source claims with the old document. The old central record retained them. The bounded fix preserves the agreed waiting period by requiring scan before that document may be removed; no orphan concept, fallback store, or early component creation.

Final full-context complexity review found two AC-backed blockers; no broader architecture change was recommended. (1) Removing an empty former owner could erase detached claims; removal now requires scan first while such rows wait. Existing detach test failed before this fix and now proves refusal, row preservation, scan transfer, then successful old-owner deletion. (2) A fenced Markdown example containing a Relationships heading was stripped as a real section, losing the new authored claim. The section writer now recognizes headings outside fenced code. Existing derived-to-authored lifecycle coverage failed before and now proves example preservation plus the resolved authored claim. Targeted implementer re-review is limited to these fixes: no new store, persisted metadata, compatibility, or abstraction; both use existing responsibilities. All 17 focused lifecycle/removal tests and changed-file lint pass. Required check is being rerun after these fixes.

Targeted full-context re-review approved both fixes: fenced examples remain authored content, real relationship sections are replaced, and deletion is refused only while detached claims wait for scan. No blocking findings remain and no additional architecture changes are recommended.

Final required check after both review fixes passed: Node 16 pass; Bun 758 pass, 48 skip, 0 fail (806 tests across 140 files). Changed-file lint and git diff --check pass. No changed TypeScript file exceeds 500 lines. Final full-context targeted review approved; no blocking findings remain. All task-generated standalone architecture records were combined into existing owners. Work is complete and remains uncommitted pending user confirmation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Outgoing relationship tables now live in their source C4 element documents and retain exact file/concept endpoints. CLI authoring, scanner refresh, combine, moves, and renames preserve their meaning; detached rows wait until scan assigns an owner. Scans compare claims per document and write only changed documents. The obsolete central concept and prototype records were replaced. Reviews found and resolved deletion of waiting rows and fenced Markdown corruption, with before/after regression evidence. The required check passes (774 passed, 48 skipped). Isolated actual-scanner qualification passed on Backlog.md (213 components), mise (381), Keycloak (5417), and openclaw (3054), including unchanged-scan zero writes and detach/recombine transfer. Keycloak source analysis retained its recorded missing-type diagnostics. Original external repositories were not changed.
<!-- SECTION:FINAL_SUMMARY:END -->
