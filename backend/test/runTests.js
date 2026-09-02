const path = require('path')

const suites = [
  require(path.join(__dirname, 'aiService.test.js')),
  require(path.join(__dirname, 'gameController.test.js')),
  require(path.join(__dirname, 'authMiddleware.test.js')),
]

async function main() {
  let passed = 0
  let failed = 0

  for (const suite of suites) {
    for (const testCase of suite) {
      try {
        await testCase.run()
        passed++
        console.log(`PASS ${testCase.name}`)
      } catch (error) {
        failed++
        console.error(`FAIL ${testCase.name}`)
        console.error(error.stack || error.message)
      }
    }
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Test runner failed:', error)
  process.exit(1)
})
