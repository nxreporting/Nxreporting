#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * 
 * This script validates that the production deployment is working correctly
 * by testing all critical endpoints and functionality.
 */

import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'

interface ValidationResult {
  test: string
  status: 'PASS' | 'FAIL'
  message: string
  responseTime?: number
  details?: any
}

interface ValidationReport {
  timestamp: string
  baseUrl: string
  results: ValidationResult[]
  summary: {
    total: number
    passed: number
    failed: number
    successRate: number
  }
  status: 'HEALTHY' | 'UNHEALTHY'
}

class ProductionValidator {
  private baseUrl: string
  private results: ValidationResult[] = []

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  async validateDeployment(): Promise<ValidationReport> {
    console.log(`🚀 Validating production deployment at: ${this.baseUrl}\n`)

    // Test basic connectivity
    await this.testHealthEndpoint()
    
    // Test authentication endpoints
    await this.testAuthEndpoints()
    
    // Test file upload endpoint
    await this.testFileUploadEndpoint()
    
    // Test brand management endpoints
    await this.testBrandEndpoints()
    
    // Test error handling
    await this.testErrorHandling()
    
    // Test performance
    await this.testPerformance()

    return this.generateReport()
  }

  private async testHealthEndpoint(): Promise<void> {
    console.log('🏥 Testing health endpoint...')
    
    try {
      const startTime = Date.now()
      const response = await fetch(`${this.baseUrl}/api/health`)
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data.status === 'healthy') {
          this.results.push({
            test: 'Health Endpoint',
            status: 'PASS',
            message: 'Health endpoint is responding correctly',
            responseTime,
            details: data.data
          })
        } else {
          this.results.push({
            test: 'Health Endpoint',
            status: 'FAIL',
            message: 'Health endpoint returned unhealthy status',
            responseTime,
            details: data
          })
        }
      } else {
        this.results.push({
          test: 'Health Endpoint',
          status: 'FAIL',
          message: `Health endpoint returned ${response.status}`,
          responseTime
        })
      }
    } catch (error) {
      this.results.push({
        test: 'Health Endpoint',
        status: 'FAIL',
        message: `Health endpoint failed: ${error.message}`,
        details: error
      })
    }
  }

  private async testAuthEndpoints(): Promise<void> {
    console.log('🔐 Testing authentication endpoints...')
    
    // Test registration endpoint
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          password: 'testpassword123',
          name: 'Test User'
        })
      })

      if (response.status === 201 || response.status === 409) { // 409 if user exists
        this.results.push({
          test: 'Registration Endpoint',
          status: 'PASS',
          message: 'Registration endpoint is accessible'
        })
      } else {
        this.results.push({
          test: 'Registration Endpoint',
          status: 'FAIL',
          message: `Registration endpoint returned ${response.status}`
        })
      }
    } catch (error) {
      this.results.push({
        test: 'Registration Endpoint',
        status: 'FAIL',
        message: `Registration endpoint failed: ${error.message}`
      })
    }

    // Test login endpoint with invalid credentials (should return 401)
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
      })

      if (response.status === 401) {
        this.results.push({
          test: 'Login Endpoint',
          status: 'PASS',
          message: 'Login endpoint correctly rejects invalid credentials'
        })
      } else {
        this.results.push({
          test: 'Login Endpoint',
          status: 'FAIL',
          message: `Login endpoint returned unexpected status: ${response.status}`
        })
      }
    } catch (error) {
      this.results.push({
        test: 'Login Endpoint',
        status: 'FAIL',
        message: `Login endpoint failed: ${error.message}`
      })
    }
  }

  private async testFileUploadEndpoint(): Promise<void> {
    console.log('📁 Testing file upload endpoint...')
    
    try {
      // Test with invalid request (no file)
      const response = await fetch(`${this.baseUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.status === 400 || response.status === 401) {
        this.results.push({
          test: 'File Upload Endpoint',
          status: 'PASS',
          message: 'File upload endpoint is accessible and validates requests'
        })
      } else {
        this.results.push({
          test: 'File Upload Endpoint',
          status: 'FAIL',
          message: `File upload endpoint returned unexpected status: ${response.status}`
        })
      }
    } catch (error) {
      this.results.push({
        test: 'File Upload Endpoint',
        status: 'FAIL',
        message: `File upload endpoint failed: ${error.message}`
      })
    }
  }

  private async testBrandEndpoints(): Promise<void> {
    console.log('🏷️ Testing brand management endpoints...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/brands/search?q=test`)

      if (response.status === 200 || response.status === 401) {
        this.results.push({
          test: 'Brand Search Endpoint',
          status: 'PASS',
          message: 'Brand search endpoint is accessible'
        })
      } else {
        this.results.push({
          test: 'Brand Search Endpoint',
          status: 'FAIL',
          message: `Brand search endpoint returned ${response.status}`
        })
      }
    } catch (error) {
      this.results.push({
        test: 'Brand Search Endpoint',
        status: 'FAIL',
        message: `Brand search endpoint failed: ${error.message}`
      })
    }
  }

  private async testErrorHandling(): Promise<void> {
    console.log('⚠️ Testing error handling...')
    
    try {
      // Test non-existent endpoint
      const response = await fetch(`${this.baseUrl}/api/nonexistent`)

      if (response.status === 404) {
        this.results.push({
          test: 'Error Handling',
          status: 'PASS',
          message: 'Application correctly handles non-existent endpoints'
        })
      } else {
        this.results.push({
          test: 'Error Handling',
          status: 'FAIL',
          message: `Non-existent endpoint returned ${response.status} instead of 404`
        })
      }
    } catch (error) {
      this.results.push({
        test: 'Error Handling',
        status: 'FAIL',
        message: `Error handling test failed: ${error.message}`
      })
    }
  }

  private async testPerformance(): Promise<void> {
    console.log('⚡ Testing performance...')
    
    const performanceTests = []
    
    // Test multiple concurrent requests to health endpoint
    for (let i = 0; i < 5; i++) {
      performanceTests.push(
        fetch(`${this.baseUrl}/api/health`).then(response => ({
          status: response.status,
          time: Date.now()
        }))
      )
    }

    try {
      const startTime = Date.now()
      const results = await Promise.all(performanceTests)
      const totalTime = Date.now() - startTime
      
      const successfulRequests = results.filter(r => r.status === 200).length
      
      if (successfulRequests >= 4 && totalTime < 10000) { // 4/5 requests successful, under 10s
        this.results.push({
          test: 'Performance Test',
          status: 'PASS',
          message: `${successfulRequests}/5 concurrent requests successful in ${totalTime}ms`,
          responseTime: totalTime
        })
      } else {
        this.results.push({
          test: 'Performance Test',
          status: 'FAIL',
          message: `Only ${successfulRequests}/5 requests successful, took ${totalTime}ms`,
          responseTime: totalTime
        })
      }
    } catch (error) {
      this.results.push({
        test: 'Performance Test',
        status: 'FAIL',
        message: `Performance test failed: ${error.message}`
      })
    }
  }

  private generateReport(): ValidationReport {
    const total = this.results.length
    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = total - passed
    const successRate = (passed / total) * 100

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      results: this.results,
      summary: {
        total,
        passed,
        failed,
        successRate
      },
      status: failed === 0 ? 'HEALTHY' : 'UNHEALTHY'
    }

    this.printReport(report)
    this.saveReport(report)

    return report
  }

  private printReport(report: ValidationReport): void {
    console.log('\n' + '='.repeat(80))
    console.log('🚀 PRODUCTION DEPLOYMENT VALIDATION REPORT')
    console.log('='.repeat(80))
    console.log(`🌐 Base URL: ${report.baseUrl}`)
    console.log(`🕐 Timestamp: ${report.timestamp}`)
    console.log(`📊 Success Rate: ${report.summary.successRate.toFixed(1)}%`)
    console.log()

    console.log('📋 Test Results:')
    report.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌'
      const time = result.responseTime ? ` (${result.responseTime}ms)` : ''
      console.log(`${status} ${result.test}: ${result.message}${time}`)
    })

    console.log()
    console.log('📊 Summary:')
    console.log(`   Total Tests: ${report.summary.total}`)
    console.log(`   Passed: ${report.summary.passed}`)
    console.log(`   Failed: ${report.summary.failed}`)
    console.log(`   Status: ${report.status}`)

    console.log()
    if (report.status === 'HEALTHY') {
      console.log('🎉 DEPLOYMENT IS HEALTHY! All critical systems are operational.')
    } else {
      console.log('⚠️ DEPLOYMENT HAS ISSUES! Please review the failed tests above.')
    }
    console.log('='.repeat(80))
  }

  private saveReport(report: ValidationReport): void {
    const reportPath = path.join(__dirname, 'production-reports', `validation-${Date.now()}.json`)
    const reportDir = path.dirname(reportPath)

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Detailed report saved to: ${reportPath}`)
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const baseUrl = process.argv[2] || process.env.VERCEL_URL || 'http://localhost:3000'
  
  if (!baseUrl) {
    console.error('❌ Please provide a base URL as an argument or set VERCEL_URL environment variable')
    process.exit(1)
  }

  const validator = new ProductionValidator(baseUrl)
  validator.validateDeployment()
    .then(report => {
      process.exit(report.status === 'HEALTHY' ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Validation failed:', error)
      process.exit(1)
    })
}

export { ProductionValidator, ValidationReport, ValidationResult }