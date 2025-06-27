pipeline {
    agent {
        docker {
            image 'node:16-alpine'
            args '-v /tmp:/tmp'
        }
    }
    
    parameters {
        string(name: 'TEST_COMMAND', defaultValue: 'npx jest', description: 'Test command to run')
        string(name: 'MAX_RETRIES', defaultValue: '3', description: 'Maximum retry attempts')
        booleanParam(name: 'AI_ENABLED', defaultValue: true, description: 'Enable AI fix generation')
    }
    
    environment {
        NODE_ENV = 'test'
        TEST_RESULTS_DIR = 'test-results'
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'mkdir -p ${TEST_RESULTS_DIR}'
            }
        }
        
        stage('Validate Framework') {
            steps {
                sh 'npx jest tests/integration/command-executor.test.js --verbose'
                sh 'node scripts/validate-command-runner.js'
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    try {
                        sh """
                            node auto-test-runner.js \
                              --command="${params.TEST_COMMAND}" \
                              --output="./${TEST_RESULTS_DIR}" \
                              --retries=${params.MAX_RETRIES} \
                              --ai=${params.AI_ENABLED}
                        """
                    } catch (Exception e) {
                        echo "Test execution failed, but continuing pipeline: ${e.message}"
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
        }
        
        stage('Analyze Results') {
            steps {
                sh 'node scripts/analyze-test-results.js'
                sh 'node scripts/check-recurring-failures.js || true'
                sh 'node scripts/generate-test-report.js'
            }
        }
        
        stage('Generate AI Dashboard') {
            steps {
                script {
                    try {
                        sh 'node scripts/generate-ai-monitoring-dashboard.js'
                        sh 'node scripts/analyze-dashboard-trends.js'
                    } catch (Exception e) {
                        echo "Dashboard generation failed, but continuing pipeline: ${e.message}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            // Archive test results
            archiveArtifacts artifacts: "${TEST_RESULTS_DIR}/**/*", allowEmptyArchive: true
            
            // Publish test reports
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: "${TEST_RESULTS_DIR}/report",
                reportFiles: 'index.html',
                reportName: 'Test Report'
            ])
            
            // Publish analysis reports
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: "${TEST_RESULTS_DIR}/analysis",
                reportFiles: 'analysis-report.md',
                reportName: 'Test Analysis'
            ])
            
            // Clean workspace
            cleanWs(patterns: [[pattern: 'node_modules/', type: 'EXCLUDE']])
        }
        
        success {
            echo 'Test automation completed successfully!'
        }
        
        unstable {
            echo 'Test automation completed with some failures. Check the test reports for details.'
        }
        
        failure {
            echo 'Test automation failed. Check the logs for details.'
        }
    }
}
