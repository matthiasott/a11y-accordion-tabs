test:
	@./node_modules/.bin/mocha --ui bdd --reporter spec test/test.js
.PHONY: test