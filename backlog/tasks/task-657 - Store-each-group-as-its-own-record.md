---
id: TASK-657
title: Store each group as its own record
status: Done
assignee:
  - '@claude'
created_date: '2026-11-12T19:48:00Z'
updated_date: '2026-11-12T20:28:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
references:
  - src/group.ts
  - src/architecture-reader.ts
  - src/flow-model.ts
  - src/curate.ts
  - src/sheet/place.ts
documentation:
  - docs/component-markdown.md
  - docs/product-model.md
modified_files:
  - backlog/tasks/task-657 - Store-each-group-as-its-own-record.md
  - src/okf-profile.ts
  - src/types.ts
  - src/architecture-reader.ts
  - src/group-model.ts
  - src/architecture-markdown.ts
  - src/relationship-storage.ts
  - src/curate-rename.ts
  - src/architecture-model.ts
  - src/markdown-emitter.ts
  - src/naming.ts
  - src/group.ts
  - src/flow-authoring.ts
  - src/add.ts
  - src/remove.ts
  - src/edit.ts
  - src/curate-rewrites.ts
  - src/curate.ts
  - src/core.ts
  - src/tag-selection.ts
  - src/plain-world.ts
  - src/write-commands.ts
  - src/sheet/place.ts
  - src/history/comparison.ts
  - src/viewers/web/comparison/details.ts
  - >-
    test/fixtures/containers-view/groma/systems/shop/containers/web/components/page.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-cache.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/catalog-api/components/catalog-api-router.md
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
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/import/components/import-router.md
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
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/media/components/media-router.md
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
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/pricing/components/pricing-router.md
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
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-queue.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-reader.md
  - >-
    test/fixtures/large-world/groma/systems/catalog/containers/product-db/components/product-db-router.md
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
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/accounts/components/accounts-router.md
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
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/audit/components/audit-router.md
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
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/auth/components/auth-router.md
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
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/directory/components/directory-router.md
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
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-queue.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-reader.md
  - >-
    test/fixtures/large-world/groma/systems/identity/containers/sessions/components/sessions-router.md
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
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/cart/components/cart-router.md
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
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/checkout/components/checkout-router.md
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
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/events/components/events-router.md
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
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-db/components/order-db-router.md
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
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-queue.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-reader.md
  - >-
    test/fixtures/large-world/groma/systems/orders/containers/order-service/components/order-service-router.md
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
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/cdn-edge/components/cdn-edge-router.md
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
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/mobile-api/components/mobile-api-router.md
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
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/search/components/search-router.md
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
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/session-store/components/session-store-router.md
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
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-gateway.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-mapper.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-queue.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-reader.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-router.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-session.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-validator.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-worker.md
  - >-
    test/fixtures/large-world/groma/systems/storefront/containers/web-app/components/web-app-writer.md
  - >-
    test/fixtures/plain-view/groma/systems/shop/containers/api/components/orders.md
  - >-
    test/fixtures/plain-view/groma/systems/shop/containers/api/components/stock.md
  - >-
    test/fixtures/validate/groma/systems/shop/containers/api/components/orders.md
  - test/fixtures/containers-view/groma/groups/web-pages.md
  - test/fixtures/large-world/groma/groups/accounts-core.md
  - test/fixtures/large-world/groma/groups/accounts-support.md
  - test/fixtures/large-world/groma/groups/audit-core.md
  - test/fixtures/large-world/groma/groups/audit-support.md
  - test/fixtures/large-world/groma/groups/auth-core.md
  - test/fixtures/large-world/groma/groups/auth-support.md
  - test/fixtures/large-world/groma/groups/cart-core.md
  - test/fixtures/large-world/groma/groups/cart-support.md
  - test/fixtures/large-world/groma/groups/catalog-api-core.md
  - test/fixtures/large-world/groma/groups/catalog-api-support.md
  - test/fixtures/large-world/groma/groups/cdn-edge-core.md
  - test/fixtures/large-world/groma/groups/cdn-edge-support.md
  - test/fixtures/large-world/groma/groups/checkout-core.md
  - test/fixtures/large-world/groma/groups/checkout-support.md
  - test/fixtures/large-world/groma/groups/directory-core.md
  - test/fixtures/large-world/groma/groups/directory-support.md
  - test/fixtures/large-world/groma/groups/events-core.md
  - test/fixtures/large-world/groma/groups/events-support.md
  - test/fixtures/large-world/groma/groups/import-core.md
  - test/fixtures/large-world/groma/groups/import-support.md
  - test/fixtures/large-world/groma/groups/media-core.md
  - test/fixtures/large-world/groma/groups/media-support.md
  - test/fixtures/large-world/groma/groups/mobile-api-core.md
  - test/fixtures/large-world/groma/groups/mobile-api-support.md
  - test/fixtures/large-world/groma/groups/order-db-core.md
  - test/fixtures/large-world/groma/groups/order-db-support.md
  - test/fixtures/large-world/groma/groups/order-service-core.md
  - test/fixtures/large-world/groma/groups/order-service-support.md
  - test/fixtures/large-world/groma/groups/pricing-core.md
  - test/fixtures/large-world/groma/groups/pricing-support.md
  - test/fixtures/large-world/groma/groups/product-db-core.md
  - test/fixtures/large-world/groma/groups/product-db-support.md
  - test/fixtures/large-world/groma/groups/search-core.md
  - test/fixtures/large-world/groma/groups/search-support.md
  - test/fixtures/large-world/groma/groups/session-store-core.md
  - test/fixtures/large-world/groma/groups/session-store-support.md
  - test/fixtures/large-world/groma/groups/sessions-core.md
  - test/fixtures/large-world/groma/groups/sessions-support.md
  - test/fixtures/large-world/groma/groups/web-app-core.md
  - test/fixtures/large-world/groma/groups/web-app-support.md
  - test/fixtures/plain-view/groma/groups/api-fulfilment.md
  - test/fixtures/validate/groma/groups/api-commerce.md
  - test-bun/helpers.ts
  - test-bun/sheet-compose.test.ts
  - test-bun/sheet-locality.test.ts
  - test-bun/sheet-route-space.test.ts
  - test-bun/sheet-scene.test.ts
  - test-bun/architecture-color.test.ts
  - test-bun/architecture-icons.test.ts
  - test-bun/tag-selection.test.ts
  - test-bun/tag-subset.test.ts
  - test/core.test.ts
  - test/fixtures/revision-comparison.json
  - test-bun/editing.test.ts
  - test-bun/rename.test.ts
  - test-bun/scan-component-naming.test.ts
  - test/architecture-model-helpers.ts
  - test-bun/group-records.test.ts
  - test-bun/revision-comparison.test.ts
  - groma/index.md
  - groma/systems/groma-md/containers/cli/components/ada-src-index.md
  - groma/systems/groma-md/containers/cli/components/angular-src-index.md
  - groma/systems/groma-md/containers/cli/components/backlog-src-index.md
  - groma/systems/groma-md/containers/cli/components/c-src-index.md
  - groma/systems/groma-md/containers/cli/components/cobol-src-index.md
  - groma/systems/groma-md/containers/cli/components/cpp-src-index.md
  - groma/systems/groma-md/containers/cli/components/csharp-src-index.md
  - groma/systems/groma-md/containers/cli/components/curate.md
  - groma/systems/groma-md/containers/cli/components/dart-src-index.md
  - groma/systems/groma-md/containers/cli/components/flow-model.md
  - groma/systems/groma-md/containers/cli/components/flow.md
  - groma/systems/groma-md/containers/cli/components/flows.md
  - groma/systems/groma-md/containers/cli/components/go-src-index.md
  - groma/systems/groma-md/containers/cli/components/history-revisions.md
  - groma/systems/groma-md/containers/cli/components/instructions.md
  - groma/systems/groma-md/containers/cli/components/java-src-index.md
  - groma/systems/groma-md/containers/cli/components/javascript-src-index.md
  - groma/systems/groma-md/containers/cli/components/kind.md
  - groma/systems/groma-md/containers/cli/components/kotlin-src-index.md
  - groma/systems/groma-md/containers/cli/components/modules-discovery.md
  - groma/systems/groma-md/containers/cli/components/modules-readiness.md
  - groma/systems/groma-md/containers/cli/components/mojo-src-index.md
  - groma/systems/groma-md/containers/cli/components/mql5-src-index.md
  - groma/systems/groma-md/containers/cli/components/nasm-src-index.md
  - groma/systems/groma-md/containers/cli/components/package.md
  - groma/systems/groma-md/containers/cli/components/php-src-index.md
  - groma/systems/groma-md/containers/cli/components/plugin-settings.md
  - groma/systems/groma-md/containers/cli/components/projection.md
  - groma/systems/groma-md/containers/cli/components/r-src-index.md
  - groma/systems/groma-md/containers/cli/components/react-src-index.md
  - groma/systems/groma-md/containers/cli/components/relationship-markdown.md
  - groma/systems/groma-md/containers/cli/components/relationships.md
  - groma/systems/groma-md/containers/cli/components/repository-listing.md
  - groma/systems/groma-md/containers/cli/components/ruby-src-index.md
  - groma/systems/groma-md/containers/cli/components/runtime.md
  - groma/systems/groma-md/containers/cli/components/rust-src-index.md
  - groma/systems/groma-md/containers/cli/components/scala-src-index.md
  - groma/systems/groma-md/containers/cli/components/scan-evidence.md
  - groma/systems/groma-md/containers/cli/components/scanner-registry.md
  - groma/systems/groma-md/containers/cli/components/scanner-session.md
  - groma/systems/groma-md/containers/cli/components/scanner-source-watch.md
  - groma/systems/groma-md/containers/cli/components/scanner-src-index.md
  - groma/systems/groma-md/containers/cli/components/scanners-http-routes.md
  - groma/systems/groma-md/containers/cli/components/scanners-projects.md
  - >-
    groma/systems/groma-md/containers/cli/components/scanners-typescript-operations.md
  - >-
    groma/systems/groma-md/containers/cli/components/scanners-typescript-outline.md
  - groma/systems/groma-md/containers/cli/components/scene.md
  - groma/systems/groma-md/containers/cli/components/screen.md
  - groma/systems/groma-md/containers/cli/components/search.md
  - groma/systems/groma-md/containers/cli/components/source-diff.md
  - groma/systems/groma-md/containers/cli/components/source-operations.md
  - groma/systems/groma-md/containers/cli/components/source-read.md
  - >-
    groma/systems/groma-md/containers/cli/components/src-architecture-findings.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-reader.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-watch.md
  - groma/systems/groma-md/containers/cli/components/src-authoring.md
  - groma/systems/groma-md/containers/cli/components/src-cli.md
  - groma/systems/groma-md/containers/cli/components/src-core.md
  - groma/systems/groma-md/containers/cli/components/src-http-endpoints.md
  - groma/systems/groma-md/containers/cli/components/src-index.md
  - groma/systems/groma-md/containers/cli/components/src-initialize.md
  - groma/systems/groma-md/containers/cli/components/src-lint-command.md
  - groma/systems/groma-md/containers/cli/components/src-list-window.md
  - groma/systems/groma-md/containers/cli/components/src-scanner.md
  - groma/systems/groma-md/containers/cli/components/src-structure.md
  - groma/systems/groma-md/containers/cli/components/src-view-host.md
  - groma/systems/groma-md/containers/cli/components/src-welcome.md
  - groma/systems/groma-md/containers/cli/components/src-work-pins.md
  - groma/systems/groma-md/containers/cli/components/swift-src-index.md
  - groma/systems/groma-md/containers/cli/components/themes.md
  - groma/systems/groma-md/containers/cli/components/tui-navigation.md
  - groma/systems/groma-md/containers/cli/components/tui-paint.md
  - groma/systems/groma-md/containers/cli/components/tui-plugin-settings.md
  - groma/systems/groma-md/containers/cli/components/typescript-src-index.md
  - groma/systems/groma-md/containers/cli/components/vue-src-index.md
  - groma/systems/groma-md/containers/cli/components/web-export.md
  - groma/systems/groma-md/containers/cli/components/web-page.md
  - groma/systems/groma-md/containers/cli/components/web-server.md
  - groma/systems/groma-md/containers/cli/components/work-model.md
  - groma/systems/groma-md/containers/cli/components/work-source-src-index.md
  - groma/systems/groma-md/containers/cli/components/work-sources.md
  - groma/systems/groma-md/containers/cli/components/workspace-packages.md
  - groma/systems/groma-md/containers/export/components/button.md
  - groma/systems/groma-md/containers/export/components/c4-filter.md
  - groma/systems/groma-md/containers/export/components/camera.md
  - groma/systems/groma-md/containers/export/components/create.md
  - groma/systems/groma-md/containers/export/components/data.md
  - groma/systems/groma-md/containers/export/components/fonts-index.md
  - groma/systems/groma-md/containers/export/components/grid.md
  - groma/systems/groma-md/containers/export/components/island.md
  - groma/systems/groma-md/containers/export/components/iso-project.md
  - groma/systems/groma-md/containers/export/components/list.md
  - groma/systems/groma-md/containers/export/components/map-debug.md
  - groma/systems/groma-md/containers/export/components/map-highlights.md
  - groma/systems/groma-md/containers/export/components/map-sharing.md
  - groma/systems/groma-md/containers/export/components/map.md
  - groma/systems/groma-md/containers/export/components/organisms-details.md
  - groma/systems/groma-md/containers/export/components/organisms-hierarchy.md
  - groma/systems/groma-md/containers/export/components/presentation.md
  - groma/systems/groma-md/containers/export/components/render.md
  - groma/systems/groma-md/containers/export/components/review-control.md
  - groma/systems/groma-md/containers/export/components/revision-control.md
  - groma/systems/groma-md/containers/export/components/search-control.md
  - groma/systems/groma-md/containers/export/components/settings-control.md
  - groma/systems/groma-md/containers/export/components/shell.md
  - groma/systems/groma-md/containers/export/components/source-control.md
  - groma/systems/groma-md/containers/export/components/startup-progress.md
  - groma/systems/groma-md/containers/export/components/task-diff-control.md
  - groma/systems/groma-md/containers/export/components/web-plugin-settings.md
  - groma/systems/groma-md/containers/export/components/web-work-pins.md
  - groma/groups/cli-architecture-records.md
  - groma/groups/cli-browser-delivery.md
  - groma/groups/cli-language-analysis.md
  - groma/groups/cli-language-scanners.md
  - groma/groups/cli-map-layout.md
  - groma/groups/cli-plugins.md
  - groma/groups/cli-project-commands.md
  - groma/groups/cli-project-work.md
  - groma/groups/cli-scanner-management.md
  - groma/groups/cli-scanner-support.md
  - groma/groups/cli-shared-viewer-data.md
  - groma/groups/cli-source-scanning.md
  - groma/groups/cli-terminal-map.md
  - groma/groups/export-architecture-panels.md
  - groma/groups/export-browser-controls.md
  - groma/groups/export-browser-session.md
  - groma/groups/export-map-drawing.md
  - groma/groups/export-project-work.md
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/agent-instructions/structure.md
  - docs/agent-instructions/inspect.md
  - docs/agent-instructions/backlog.md
  - src/instructions.ts
  - src/scan-reconciler.ts
type: feature
ordinal: 706000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A group is the one thing authors fully control in groma: people and agents create it, the scanner never does, and it persists. Until now a group was only a name repeated in groma.group on every member, so it had nowhere to hold meaning of its own (a description, and later tags, a color and an icon), no id to edit it by, and it vanished with its last member. On 2026-11-12 Alex asked that groups be treated equally with C4 elements in personalization. This task gives each group one authored document that lists its members, with no change to what the maps draw. Selecting a group, and tags, color and icon on a group, are later tasks. Two rules stay enforced here and are lifted by their own tasks: a component belongs to at most one group (TASK-656) and a group holds no groups (TASK-655).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A group is one Groma Group document at groups/<id>.md with a title, an optional description and overview, and a Members list of Markdown links to its components; component documents carry no group field
- [x] #2 groma add group, groma edit <group-id>, groma edit <component-id> --group or --ungroup, and groma remove <group-id> write group records; the <container-id>/<group-kebab> address no longer exists
- [x] #3 Loading refuses a group whose member link does not resolve to a component, whose members sit in different containers, or that lists a component another group already lists
- [x] #4 Removing a grouped component, renaming a member or its container, and moving a container all leave every group record loadable; a component moved to another container leaves its group, and a grouped component cannot be combined away
- [x] #5 The web map, the terminal map and exports draw the same zones as before for the same groups
- [x] #6 groma's own map and the test fixtures store their groups as records
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
1. Record: GROUP_TYPE 'Groma Group' in okf-profile; the reader collects records.groups; src/group-model.ts resolveGroups(documents, model) mirrors flow-model and owns every load rule (id, path groups/<id>.md, members are components of one identified container, one group per component). ArchitectureElement and the element groma fields lose group.
2. View graph: annotateArchitecture resolves groups, points each member at its group id (AnnotatedElement.group) and lists the groups' meaning in graph.groups. The record lists members; the view graph points members at their group, as it does with parent.
3. Authoring in src/group.ts, every write through writeGroups, which loads the result before writing: add group (id = <container-id>-<kebab title>; a title the container already has joins that group, as before), edit <group-id> title/description/overview, edit <component-id> --group <group-id> or --ungroup as an edit of its own, remove <group-id>. freeId and the scan's id allocation know group ids. Removing a component drops its link. Group links follow a rename and a container move; a component whose document moves to another container leaves its group; a grouped component cannot be combined away; requireLoadableResult resolves groups. The <container-id>/<group-kebab> address, groupAddress, isGroupAddress and the reserved word group are deleted.
4. Consumers: sheet zones are keyed by group id and named by its title; zoning of containers (hand-written only, no command wrote it) is removed; plain view prints group:<id> and groma view <group-id> prints the record; comparison keeps the groups of both revisions and its details show group titles.
5. Data, no migration code: a scratch script rewrote the four fixture bundles that use groups through the real add command; groma's own groups were dissolved with the previous CLI and recreated with the new one.
6. Docs: docs/component-markdown.md (Groups section, field table), docs/product-model.md, agent instructions.
7. Tests. (a) Rule: the load rules of criterion 3. Wrong result: a dangling member link, a container as member, members in two containers, or a component in two groups loads silently. Gap: no group record existed; test-bun/group-records.test.ts on a temp copy of the edit fixture. (b) Rule: criteria 2 and 4, the verbs keep records loadable. Wrong result: a removed or renamed member leaves a broken link, a container move is refused, a component moved to another container stays listed, a move to its own container ungroups it (review defect), grouping under an existing title creates a second group (review defect). Gap: the old tests only knew the groma.group field; same file. (c) Rule: a scan keeps the map loadable (reproduced review defect). Wrong result: a new source file takes a group's id and every later load fails. Gap: scan naming tests cover element and reserved ids only; one test in the same file. (d) Rule: a comparison draws removed components (existing behavior). Wrong result: a removed component names a group the destination no longer has and the comparison map throws. Gap: none covered it; one test in revision-comparison.test.ts. (e) Zones (criterion 5): existing projection, sheet and navigation tests already prove zone geometry; only their worlds changed shape.
8. bun run check, cold simplicity review and full-context review in parallel, fixes, commit, push with gh stack submit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions made while building (mine, to confirm with Alex): (1) records live at groups/<id>.md at the bundle root like flows, not beside the container's components, so a group file never moves when its container is renamed or moved and only its links follow; (2) a new group's id is always <container-id>-<kebab name>, one rule with no order-dependent fallback, because the same name in two containers is common (Project work exists in cli and export); (3) member links use the component id as link text, like relationship rows; (4) the view graph points each member at its group id and lists the groups without members, so a comparison can keep a removed component in its zone by adding the start revision's groups; (5) --group and --ungroup are their own edit because they write the group record, not the component; (6) a component moved to another container leaves its group instead of being refused, because the web map offers the move and has no ungroup action; (7) a component of an unidentified container cannot join a group, so scan placement never splits a group across containers; (8) zoning of containers by a hand-written groma.group is removed: no command wrote it and nothing used it; (9) the word group is no longer a reserved id.
Known consequence: a revision that still carries groma.group does not load, so a comparison whose start is older than this change fails for that side.
Not blocking, existing gap shared with flows: scan id allocation only avoids element ids, so a new scanned component could take an id that a flow or group already has; the next load then reports a duplicate id.
Own map: the 18 groups were dissolved with the previous CLI (worktree at 5e3ec94e) and recreated with the new CLI; the laid-out sheet (zones, slabs, buildings, islands with their rectangles) is byte-identical before and after. The new src/group-model.ts was scanned as a stand-alone component and folded into curate (Architecture structure).

Verification: bun run check passes (28 Node tests, 964 Bun tests, 0 failures, the 2 lint warnings are older and in other files). Criterion 1, 2: test-bun/group-records.test.ts drives add, edit, --group, --ungroup and remove through the shared writes and compares the component document byte for byte; no groupAddress or isGroupAddress remains. Criterion 3: the same file writes four invalid records and expects each load to be refused. Criterion 4: the same file removes, renames and moves members and containers; on a copy of the edit fixture, groma edit stock --combine planned-check answers: cannot combine planned-check while group api-checks lists it. Criterion 5: right after re-authoring, the laid-out sheet of groma's own map (19 zones, 5 slabs, 129 buildings with rectangles) was byte-identical to the one before the task; the export renders the 19 zones with no console message; projection, navigation, sheet and container-layout tests pass. After this task's new source file was scanned into curate, that building is one unit taller and neighbours moved by one cell, with zones, members and footprints unchanged. Criterion 6: no component under groma/ or test/fixtures carries group:, groma/groups holds 18 records.
Reviews (cold simplicity review and full-context review, run in parallel). Fixed defects, each with a test that fails before its fix: a move to the container a component is already in took it out of its group; grouping under a title the container already has was refused or created a second group, where before it joined (the web map's only way to add to a group); a scan could give a new component the id of a group, after which no load succeeded (scans now treat flow, group and draft ids as taken, through otherRecordIds, which freeId also uses). Applied simplifications: CurationContext extends GroupContext and both are built by groupContext; writeGroups is the one exported, validating write and remove.ts uses it; groupWritesForMoves says what it decides; edit and remove look an id up in the same order (flow, element, group, draft); editElement split out of editArchitecture to stay under the complexity limit; the comparison details no longer fall back to the id.
Left for Alex (not applied): rename src/group.ts to src/group-authoring.ts after the flow files; keep or drop the component check in requireComponent, which repeats a load rule to give a clean message; one membership direction in the view graph too, which the full-context review does not recommend before TASK-656; ids versus titles as member link text.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A group is now one authored record: a Groma Group document at groups/<id>.md with a title, an optional description and overview, and a Members list of links to components of one container. Components carry no group field. groma add group creates the record (or adds to the container's group of that title), groma edit <group-id> changes its meaning, groma edit <component-id> --group <group-id> or --ungroup changes one membership, groma remove <group-id> deletes it, and groma view <group-id> prints it. src/group-model.ts owns the load rules, src/group.ts the writes; removal, renames, moves and scans keep every record loadable. The view graph lists the groups and points each member at its group id, so the maps draw the same zones as before. groma's own 18 groups and the four fixture bundles were re-authored through the commands. bun run check passes. Known consequence: a revision that still has groma.group does not load, so a comparison whose start is older than this change fails for that side. Follow-ups that need Alex: the selectable group, then tags, color and icon on groups.
<!-- SECTION:FINAL_SUMMARY:END -->
