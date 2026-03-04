# Changelog

## [1.3.0](https://github.com/arcade-cabinet/goats-in-hell/compare/v1.2.0...v1.3.0) (2026-03-04)


### Features

* 3-tier whelp/elder enemy hierarchy + full Meshy asset pipeline ([7bcb110](https://github.com/arcade-cabinet/goats-in-hell/commit/7bcb1100c9fc393662a565836acfec46f4af0a0b))
* ship all nine circles — prop mapping, overhauls, A*, rendering, 9/9 playtests pass ([5c0e2cf](https://github.com/arcade-cabinet/goats-in-hell/commit/5c0e2cf9cddba92ed07de4db8a0a3a2ced7cf345))
* YUKA Brain Assembly — unified goal-driven AI (Tasks 1-12) ([c8a976f](https://github.com/arcade-cabinet/goats-in-hell/commit/c8a976f0b07272ef41caa16f527443834e7da6ca))

## [1.2.0](https://github.com/arcade-cabinet/goats-in-hell/compare/v1.1.1...v1.2.0) (2026-03-03)


### Features

* blocking loading screen, foldable touch controls, mobile perf ([#25](https://github.com/arcade-cabinet/goats-in-hell/issues/25)) ([05a9f27](https://github.com/arcade-cabinet/goats-in-hell/commit/05a9f2741180354f415a2037ca5c3369af0dc0cc))
* Meshy asset explosion + cross-platform Phase 1 + game.db save system ([378993d](https://github.com/arcade-cabinet/goats-in-hell/commit/378993d018d2c4ee20118dce98bb57278e5fbbfc))
* Meshy prop pipeline, asset reorganization, and game system improvements ([#22](https://github.com/arcade-cabinet/goats-in-hell/issues/22)) ([257c8f5](https://github.com/arcade-cabinet/goats-in-hell/commit/257c8f588dc570b8dbc80e65a98fdee5766aa407))
* SQLite/Drizzle level database, 9 circles, .claude infrastructure, and game assets ([#20](https://github.com/arcade-cabinet/goats-in-hell/issues/20)) ([93ba7f4](https://github.com/arcade-cabinet/goats-in-hell/commit/93ba7f4f2c54e7447042051f622ca5c6dad7952b))


### Bug Fixes

* add loading screen, fix AI stuck detection order-of-operations ([#18](https://github.com/arcade-cabinet/goats-in-hell/issues/18)) ([5afefca](https://github.com/arcade-cabinet/goats-in-hell/commit/5afefcae7f4e399f0cfc6c97b9fd889787ab223c))
* correct .claude/hooks schema to match Claude Code hook system ([#21](https://github.com/arcade-cabinet/goats-in-hell/issues/21)) ([7ccb8ac](https://github.com/arcade-cabinet/goats-in-hell/commit/7ccb8ac910c54f36aaeb05e08b9c958b56238b64))
* dead player HP carried over to new game ([#19](https://github.com/arcade-cabinet/goats-in-hell/issues/19)) ([2e6b5f9](https://github.com/arcade-cabinet/goats-in-hell/commit/2e6b5f9a2689a5b47e66ffa36accc8e31d192430))
* lighting overhaul, AI navigation, and combat QoL ([#15](https://github.com/arcade-cabinet/goats-in-hell/issues/15)) ([bd50706](https://github.com/arcade-cabinet/goats-in-hell/commit/bd5070611bd13e54336b560c8a53daf85494628b))
* **renderer:** WebGL2 probe + error screen, Pages smoke/visual e2e tests ([#24](https://github.com/arcade-cabinet/goats-in-hell/issues/24)) ([41cfc5a](https://github.com/arcade-cabinet/goats-in-hell/commit/41cfc5a98598b3d3e8712f293dd08f6b6b1881a1))

## [1.1.1](https://github.com/arcade-cabinet/goats-in-hell/compare/v1.1.0...v1.1.1) (2026-02-28)


### Bug Fixes

* WebGPU GLB material rendering + CI pnpm ([#13](https://github.com/arcade-cabinet/goats-in-hell/issues/13)) ([fcb18b1](https://github.com/arcade-cabinet/goats-in-hell/commit/fcb18b143448d8156ae4372ba6abf429ad3b7a03))

## [1.1.0](https://github.com/arcade-cabinet/goats-in-hell/compare/v1.0.0...v1.1.0) (2026-02-28)


### Features

* WebGPU renderer, Git LFS, memory leak cleanup, player journey fixes ([dc9fafc](https://github.com/arcade-cabinet/goats-in-hell/commit/dc9fafc90cd37157757dca551dc8d6e5183921fa))


### Bug Fixes

* **ci:** add expo prebuild for Android builds, gitignore native dirs ([#11](https://github.com/arcade-cabinet/goats-in-hell/issues/11)) ([f9d179c](https://github.com/arcade-cabinet/goats-in-hell/commit/f9d179c1e2cf2915d936f5bb887444ab03fd9350))
* **ci:** use npm install instead of npm ci ([#8](https://github.com/arcade-cabinet/goats-in-hell/issues/8)) ([ae94c09](https://github.com/arcade-cabinet/goats-in-hell/commit/ae94c09b2f80535e1694a57b6ee0284d93809df4))

## 1.0.0 (2026-02-28)


### Features

* complete game — balance, production build, touch controls ([77b5cdf](https://github.com/arcade-cabinet/goats-in-hell/commit/77b5cdfeb8e16a2e3fe574385a8f28ad011c780c))
* complete R3F game systems, fix combat, add CI/CD pipeline ([#6](https://github.com/arcade-cabinet/goats-in-hell/issues/6)) ([ce62e94](https://github.com/arcade-cabinet/goats-in-hell/commit/ce62e94cd62da76e70ddce1f49440330956aabf4))
* rewrite rendering layer from Babylon.js to React Three Fiber ([#4](https://github.com/arcade-cabinet/goats-in-hell/issues/4)) ([9fb43d3](https://github.com/arcade-cabinet/goats-in-hell/commit/9fb43d3b5ef50e438c74a66c119fd9c66fd93f1b))


### Bug Fixes

* wire R3FRoot game orchestrator + fix spawn position + post-processing crash ([#5](https://github.com/arcade-cabinet/goats-in-hell/issues/5)) ([a9f624c](https://github.com/arcade-cabinet/goats-in-hell/commit/a9f624c8dd4702a24be1af896e48dae5221ee5b5))
