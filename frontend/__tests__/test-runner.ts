#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Vercel + Supabase Migration
 * 
 * This script runs all tests and generates a comprehensive report
 * for the migration validation.
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  suite: string
  passed: number
  failed: number
  total: number
  duration: number
  coverage?: number
}

interface TestReport {
  timestamp: string
  environment: string
  results: TestResult[]
  summary: {
    totalTests: number
    totalPassed: number
    totalFailed: number
    overallCoverage: number
    duration: number
  }
  status: 'PASSED' | 'FAILED'
}

class TestRunner {
  private results: TestResult[] = []
  private startTime: number = Date.now()

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting comprehensive test suite for Vercel + Supabase migration...\n')

    try {
      // Run unit tests
      await this.runTestSuite('Unit Tests', 'jest --testPathPattern=unit --coverage --silent')
      
      // Run integration tests
      await this.runTestSuite('Integration Tests', 'jest --testPathPattern=integration --silent')
      
      // Run API tests
      await this.runTestSuite('API Tests', 'jest --testPathPattern=api --silent')
      
      // Run deployment validation
      await this.runTestSuite('Deployment Validation', 'jest --testPathPattern=deployment-validation --silent')

    } catch (error) {
      console.error('❌ Test execution failed:', error)
    }

    return this.generateReport()
  }

  private async runTestSuite(suiteName: string, command: string): Promise<void> {
    console.log(`📋 Running ${suiteName}...`)
    const startTime = Date.now()

    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      })

      const duration = Date.now() - startTime
      const result = this.parseJestOutput(output, suiteName, duration)
      this.results.push(result)

      console.log(`✅ ${suiteName}: ${result.passed}/${result.total} tests passed (${duration}ms)`)

    } catch (error: any) {
      const duration = Date.now() - startTime
      const output = error.stdout || error.stderr || ''
      const result = this.parseJestOutput(output, suiteName, duration, true)
      this.results.push(result)

      console.log(`❌ ${suiteName}: ${result.passed}/${result.total} tests passed (${duration}ms)`)
    }
  }

  private parseJestOutput(output: string, suiteName: string, duration: number, failed: boolean = false): TestResult {
    // Parse Jest output to extract test results
    const lines = output.split('\n')
    
    let passed = 0
    let total = 0
    let coverage = 0

    // Look for test summary
    const summaryLine = lines.find(line => line.includes('Tests:'))
    if (summaryLine) {
      const passedMatch = summaryLine.match(/(\d+) passed/)
      const failedMatch = summaryLine.match(/(\d+) failed/)
      const totalMatch = summaryLine.match(/(\d+) total/)

      if (passedMatch) passed = parseInt(passedMatch[1])
      if (totalMatch) total = parseInt(totalMatch[1])
      if (!total && passedMatch) total = passed
    }

    // Look for coverage information
    const coverageLine = lines.find(line => line.includes('All files'))
    if (coverageLine) {
      const coverageMatch = coverageLine.match(/(\d+\.?\d*)%/)
      if (coverageMatch) coverage = parseFloat(coverageMatch[1])
    }

    return {
      suite: suiteName,
      passed,
      failed: total - passed,
      total,
      duration,
      coverage: coverage > 0 ? coverage : undefined
    }
  }

  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime
    const totalTests = this.results.reduce((sum, result) => sum + result.total, 0)
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0)
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0)
    
    const coverageResults = this.results.filter(r => r.coverage !== undefined)
    const overallCoverage = coverageResults.length > 0 
      ? coverageResults.reduce((sum, result) => sum + (result.coverage || 0), 0) / coverageResults.length
      : 0

    const report: TestReport = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      results: this.results,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        overallCoverage,
        duration: totalDuration
      },
      status: totalFailed === 0 ? 'PASSED' : 'FAILED'
    }

    this.printReport(report)
    this.saveReport(report)

    return report
  }

  private printReport(report: TestReport): void {
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST REPORT SUMMARY')
    console.log('='.repeat(80))
    console.log(`🕐 Timestamp: ${report.timestamp}`)
    console.log(`🌍 Environment: ${report.environment}`)
    console.log(`⏱️  Total Duration: ${report.summary.duration}ms`)
    console.log(`📈 Overall Coverage: ${report.summary.overallCoverage.toFixed(1)}%`)
    console.log()

    console.log('📋 Test Suite Results:')
    report.results.forEach(result => {
      const status = result.failed === 0 ? '✅' : '❌'
      const coverage = result.coverage ? ` (${result.coverage.toFixed(1)}% coverage)` : ''
      console.log(`${status} ${result.suite}: ${result.passed}/${result.total} passed${coverage}`)
    })

    console.log()
    console.log('📊 Overall Summary:')
    console.log(`   Total Tests: ${report.summary.totalTests}`)
    console.log(`   Passed: ${report.summary.totalPassed}`)
    console.log(`   Failed: ${report.summary.totalFailed}`)
    console.log(`   Success Rate: ${((report.summary.totalPassed / report.summary.totalTests) * 100).toFixed(1)}%`)

    console.log()
    if (report.status === 'PASSED') {
      console.log('🎉 ALL TESTS PASSED! Migration validation successful.')
    } else {
      console.log('❌ SOME TESTS FAILED! Please review the failures above.')
    }
    console.log('='.repeat(80))
  }

  private saveReport(report: TestReport): void {
    const reportPath = path.join(__dirname, '..', 'test-reports', `test-report-${Date.now()}.json`)
    const reportDir = path.dirname(reportPath)

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Detailed report saved to: ${reportPath}`)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner()
  runner.runAllTests()
    .then(report => {
      process.exit(report.status === 'PASSED' ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error)
      process.exit(1)
    })
}

export { TestRunner, TestReport, TestResult }