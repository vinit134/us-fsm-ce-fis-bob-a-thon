// ═══════════════════════════════════════════════════════════════════
// FIS Bob-a-thon — Base Pipeline (Jenkinsfile)
//
// Starting point for the 5-lab workshop. Provisions a Kubernetes
// agent pod with three containers — build-tools (Maven + JDK17),
// oc-tools (OpenShift CLI), and bob (IBM Bob CLI) — sharing a
// workspace-volume emptyDir mounted at /workspace on all three,
// with HOME set to /workspace so Bob can read .bob/custom_modes.yaml
// from the checkout.
//
// This file has a single Checkout stage. Each lab adds one more
// stage beneath it; see labs/LAB<N>_*.md for instructions.
//
// Before running: if your OpenShift project is NOT named `jenkins`,
// update the `bob` container image URL below.
// ═══════════════════════════════════════════════════════════════════

// Per-instance Jira credential routing. Each pipeline self-selects which
// jira-creds-{a..n} secret to mount based on the user number parsed
// from its job name. See setup/JIRA_ACCOUNT_SETUP.md Section 3.3.
//
// Users are paired across 14 Jira accounts:
//   user1/2 -> jira-creds-a, user3/4 -> jira-creds-b, ...,
//   user27/28 -> jira-creds-n. user29+ share user28's instance
//   (jira-creds-n) — we only provisioned 14 Jira accounts.
//
// @NonCPS keeps the regex Matcher object inside this method so it never
// becomes a CPS-serialized local variable (Matcher is not Serializable
// and would crash the pipeline on checkpoint).
@NonCPS
def routeJiraSecret(String jobName) {
    def m = jobName =~ /user0*(\d+)/
    if (!m) return 'jira-creds-n'
    int userNum = m[0][1].toInteger()
    if (userNum < 1) return 'jira-creds-n'
    def letters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n']
    int letterIdx = Math.min((userNum - 1).intdiv(2), 13)
    return "jira-creds-${letters[letterIdx]}"
}

def jiraSecret = routeJiraSecret(env.JOB_NAME ?: '')

// ── Helper: ask Bob, optionally with a specific custom mode ───────────────────
// Writes the prompt to a tempfile in the shared workspace and runs `bob` in
// the bob container, adding `--chat-mode <slug>` only when a mode is provided.
// Returns the analysis as a string. Using a tempfile (instead of inlining the
// prompt on the command line) avoids shell-escaping issues when the prompt
// contains quotes, backticks, or newlines — common with diffs.
def askBob(String prompt, String mode = null) {
    container('bob') {
        def promptFile = ".bob-prompt-${System.currentTimeMillis()}.txt"
        writeFile file: promptFile, text: prompt

        def modeFlag = mode ? "--chat-mode ${mode}" : ""
        def analysis = sh(
            script: """bob ${modeFlag} -p "\$(cat ${promptFile})" --hide-intermediary-output""",
            returnStdout: true
        ).trim()

        sh "rm -f ${promptFile}"
        return analysis
    }
}

pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins
  containers:
  - name: build-tools
    image: maven:3.9-eclipse-temurin-17
    command: ['sleep', 'infinity']
    workingDir: /workspace
    volumeMounts:
    - name: workspace-volume
      mountPath: /workspace
    env:
    - name: HOME
      value: /workspace
  - name: oc-tools
    image: quay.io/openshift/origin-cli:latest
    command: ['sleep', 'infinity']
    workingDir: /workspace
    volumeMounts:
    - name: workspace-volume
      mountPath: /workspace
    env:
    - name: HOME
      value: /workspace
  - name: lint-tools
    image: image-registry.openshift-image-registry.svc:5000/jenkins/lint-tools:latest
    command: ['sleep', 'infinity']
    workingDir: /workspace
    volumeMounts:
    - name: workspace-volume
      mountPath: /workspace
    env:
    - name: HOME
      value: /workspace
  - name: bob
    image: image-registry.openshift-image-registry.svc:5000/jenkins/bob-cli:latest
    command: ['sleep', 'infinity']
    workingDir: /workspace
    volumeMounts:
    - name: workspace-volume
      mountPath: /workspace
    env:
    - name: BOBSHELL_API_KEY
      valueFrom:
        secretKeyRef:
          name: bob-cli-credentials
          key: BOBSHELL_API_KEY
    - name: BOB_ACCEPT_LICENSE
      value: "true"
    - name: HOME
      value: /workspace
    - name: JIRA_URL
      valueFrom:
        secretKeyRef:
          name: ${jiraSecret}
          key: JIRA_URL
    - name: JIRA_USERNAME
      valueFrom:
        secretKeyRef:
          name: ${jiraSecret}
          key: JIRA_USERNAME
    - name: JIRA_API_TOKEN
      valueFrom:
        secretKeyRef:
          name: ${jiraSecret}
          key: JIRA_API_TOKEN
    - name: JIRA_PROJECT
      valueFrom:
        secretKeyRef:
          name: ${jiraSecret}
          key: JIRA_PROJECT
  volumes:
  - name: workspace-volume
    emptyDir: {}
"""
            defaultContainer 'build-tools'
        }
    }

    stages {
        stage('Checkout') {
            steps {
                echo "=== Checking out repository ==="
                checkout scm

                echo "=== Verifying workspace contents ==="
                sh '''
                    echo "Current directory: $(pwd)"
                    echo "Workspace contents:"
                    ls -la
                '''
            }
        }

        stage('Secret Configuration Info') {
            steps {
                script {
                    echo '════════════════════════════════════════════════════════'
                    echo '  🔐 Secret Configuration Information'
                    echo "  Started: ${new Date()}"
                    echo '════════════════════════════════════════════════════════'
                    echo ''
                    
                    // Display which secrets are being used (NOT the values!)
                    echo '📋 Secrets Referenced in Pipeline:'
                    echo '─────────────────────────────────────────────────────'
                    echo "1. Bob CLI Credentials:"
                    echo "   Secret Name: bob-cli-credentials"
                    echo "   Key: BOBSHELL_API_KEY"
                    echo "   Status: ${env.BOBSHELL_API_KEY ? '✅ Available' : '❌ Not Found'}"
                    echo ''
                    
                    echo "2. Jira Credentials:"
                    echo "   Secret Name: ${jiraSecret}"
                    echo "   Keys: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN, JIRA_PROJECT"
                    
                    container('bob') {
                        def jiraStatus = sh(
                            script: '''
                                if [ -n "$JIRA_URL" ] && [ -n "$JIRA_USERNAME" ] && [ -n "$JIRA_API_TOKEN" ] && [ -n "$JIRA_PROJECT" ]; then
                                    echo "✅ All Jira variables available"
                                else
                                    echo "❌ Some Jira variables missing"
                                fi
                            ''',
                            returnStdout: true
                        ).trim()
                        echo "   Status: ${jiraStatus}"
                        
                        // Show non-sensitive info (URLs and usernames are typically OK to display)
                        echo "   JIRA_URL: ${env.JIRA_URL ?: 'Not set'}"
                        echo "   JIRA_USERNAME: ${env.JIRA_USERNAME ?: 'Not set'}"
                        echo "   JIRA_PROJECT: ${env.JIRA_PROJECT ?: 'Not set'}"
                        echo "   JIRA_API_TOKEN: ${env.JIRA_API_TOKEN ? '[REDACTED - ' + env.JIRA_API_TOKEN.length() + ' chars]' : 'Not set'}"
                    }
                    echo ''
                    
                    echo "3. SonarQube Token (used in Security Analysis stage):"
                    echo "   Secret Name: sonarqube-token"
                    echo "   Note: Loaded on-demand in Security Analysis stage"
                    echo ''
                    
                    echo '📊 Environment Variables in Bob Container:'
                    echo '─────────────────────────────────────────────────────'
                    container('bob') {
                        sh '''
                            echo "HOME: $HOME"
                            echo "WORKSPACE: $WORKSPACE"
                            echo "BOB_ACCEPT_LICENSE: $BOB_ACCEPT_LICENSE"
                            echo "BOBSHELL_API_KEY: ${BOBSHELL_API_KEY:+[REDACTED - ${#BOBSHELL_API_KEY} chars]}"
                        '''
                    }
                    echo ''
                    
                    echo '🔍 User Routing Information:'
                    echo '─────────────────────────────────────────────────────'
                    echo "Job Name: ${env.JOB_NAME}"
                    echo "Routed Jira Secret: ${jiraSecret}"
                    echo "User Number: ${env.USER ?: 'Not set'}"
                    echo "Build Number: ${env.BUILD_NUMBER}"
                    echo ''
                    
                    echo '⚠️  Security Note:'
                    echo '─────────────────────────────────────────────────────'
                    echo 'Actual secret values are NEVER printed to logs.'
                    echo 'Only metadata and availability status are shown.'
                    echo 'Secrets are injected as environment variables by Kubernetes.'
                    echo ''
                    
                    echo "  Completed: ${new Date()}"
                    echo '════════════════════════════════════════════════════════'
                }
            }
        }

        stage('PR Review') {
            options {
                timeout(time: 5, unit: 'MINUTES')
            }
            steps {
                script {
                    echo '════════════════════════════════════════════════════════'
                    echo '  🤖 Bob PR Review Analysis'
                    echo "  Started: ${new Date()}"
                    echo '════════════════════════════════════════════════════════'
                    
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        // Configure git safe directory and capture diff
                        sh '''
                            git config --global --add safe.directory "$WORKSPACE"
                            git diff origin/main...HEAD > git-diff.txt || : > git-diff.txt
                        '''
                        
                        // Build prompt for Bob
                        def prompt = "Read git-diff.txt and produce the senior-developer PR overview."
                        
                        // Run Bob analysis
                        def analysis = askBob(prompt, 'pipeline-git-diff-overview')
                        
                        // Display analysis
                        echo ''
                        echo analysis
                        echo ''
                        
                        // Save for archiving
                        writeFile file: 'bob-pr-review.md', text: analysis
                    }
                    
                    echo "  Completed: ${new Date()}"
                    echo "  Full report: bob-pr-review.md (archived)"
                    echo '════════════════════════════════════════════════════════'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'bob-pr-review.md',
                                   allowEmptyArchive: true,
                                   fingerprint: true
                }
            }
        }

        stage('Unit Tests') {
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                script {
                    echo '════════════════════════════════════════════════════════'
                    echo '  🧪 Running Unit Tests'
                    echo "  Started: ${new Date()}"
                    echo '════════════════════════════════════════════════════════'
                    
                    // Run Maven tests and capture result
                    def testResult = sh(
                        script: 'cd order-service && mvn test',
                        returnStatus: true
                    )
                    
                    // Publish JUnit test results
                    junit testResults: 'order-service/target/surefire-reports/*.xml',
                          allowEmptyResults: true,
                          skipPublishingChecks: false
                    
                    // If tests failed, analyze with Bob
                    if (testResult != 0) {
                        echo ''
                        echo '⚠️  Tests failed - analyzing with Bob...'
                        echo ''
                        
                        catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                            def prompt = """Analyze the test failures in order-service/target/surefire-reports/
alongside the relevant source files under order-service/src/.
Provide a concise analysis of what failed and potential fixes."""
                            
                            def analysis = askBob(prompt, 'pipeline-test-failure-analyzer')
                            
                            echo ''
                            echo analysis
                            echo ''
                            
                            // Save analysis for archiving
                            writeFile file: 'bob-test-analysis.md', text: analysis
                        }
                        
                        echo "  Test Analysis: bob-test-analysis.md (archived)"
                    } else {
                        echo ''
                        echo '✅ All tests passed!'
                        echo ''
                    }
                    
                    echo "  Completed: ${new Date()}"
                    echo '════════════════════════════════════════════════════════'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'bob-test-analysis.md',
                                   allowEmptyArchive: true,
                                   fingerprint: true
                }
            }
        }

        stage('Security Analysis') {
            options {
                timeout(time: 15, unit: 'MINUTES')
            }
            environment {
                SONAR_TOKEN = credentials('sonarqube-token')
                SONAR_HOST_URL = 'https://sonarqube-sonarqube.apps.itz-8ggai0.infra01-lb.wdc04.techzone.ibm.com'
                PROJECT_KEY = "order-service-${env.USER}-${env.BUILD_NUMBER}"
            }
            steps {
                script {
                    echo '════════════════════════════════════════════════════════'
                    echo '  🔒 Multi-Layer Security Analysis'
                    echo "  Started: ${new Date()}"
                    echo '════════════════════════════════════════════════════════'
                    
                    // Initialize results map with serializable primitives only
                    def securityResults = [
                        sonarqube: [:],
                        grype: [:],
                        riskLevel: '',
                        riskScore: 0,
                        deploymentDecision: ''
                    ]
                    
                    // ═══════════════════════════════════════════════════════
                    // Phase 1: SonarQube Security Scanning
                    // ═══════════════════════════════════════════════════════
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        echo ''
                        echo '📊 Phase 1: SonarQube Security Scanning'
                        echo '─────────────────────────────────────────────────────'
                        
                        container('build-tools') {
                            sh """
                                cd order-service
                                mvn test-compile sonar:sonar \
                                    -Dsonar.projectKey=${env.PROJECT_KEY} \
                                    -Dsonar.projectName="Order Service ${env.USER}" \
                                    -Dsonar.host.url=${env.SONAR_HOST_URL} \
                                    -Dsonar.token=${env.SONAR_TOKEN}
                            """
                        }
                        
                        echo '⏳ Waiting for SonarQube task completion...'
                        
                        // Phase 1a: Wait for task completion
                        def taskCompleted = false
                        def taskStatus = ''
                        for (int i = 0; i < 12; i++) {
                            sleep(10)
                            try {
                                taskStatus = sh(
                                    script: """
                                        curl -s "${env.SONAR_HOST_URL}/api/ce/component?component=${env.PROJECT_KEY}" | \
                                        grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4
                                    """,
                                    returnStdout: true
                                ).trim()
                                
                                echo "  Attempt ${i+1}/12: Task status = ${taskStatus}"
                                
                                if (taskStatus == 'SUCCESS') {
                                    taskCompleted = true
                                    echo '✅ SonarQube task completed successfully'
                                    break
                                } else if (taskStatus == 'FAILED') {
                                    echo '❌ SonarQube task failed'
                                    break
                                }
                            } catch (Exception e) {
                                echo "  Warning: Could not check task status (attempt ${i+1}/12): ${e.message}"
                            }
                        }
                        
                        if (!taskCompleted) {
                            echo '⚠️  SonarQube task did not complete in time, proceeding with available data'
                        }
                        
                        // Phase 1b: Fetch metrics (only after task completion)
                        if (taskCompleted) {
                            echo '📈 Fetching SonarQube metrics...'
                            sleep(5) // Brief pause to ensure metrics are available
                            
                            def metricsJson = ''
                            for (int i = 0; i < 6; i++) {
                                try {
                                    metricsJson = sh(
                                        script: """
                                            curl -s "${env.SONAR_HOST_URL}/api/measures/component?component=${env.PROJECT_KEY}&metricKeys=bugs,vulnerabilities,code_smells,security_hotspots,security_rating,reliability_rating,security_review_rating"
                                        """,
                                        returnStdout: true
                                    ).trim()
                                    
                                    if (metricsJson && metricsJson.contains('"measures"')) {
                                        break
                                    }
                                    echo "  Attempt ${i+1}/6: Waiting for metrics..."
                                    sleep(5)
                                } catch (Exception e) {
                                    echo "  Warning: Could not fetch metrics (attempt ${i+1}/6): ${e.message}"
                                    sleep(5)
                                }
                            }
                            
                            // Parse JSON using Groovy JsonSlurper
                            if (metricsJson && metricsJson.contains('"measures"')) {
                                try {
                                    def sonarData = new groovy.json.JsonSlurper().parseText(metricsJson)
                                    
                                    if (sonarData.component?.measures && sonarData.component.measures.size() > 0) {
                                        sonarData.component.measures.each { measure ->
                                            // Store as String primitives for serialization
                                            securityResults.sonarqube[measure.metric] = measure.value ?: '0'
                                        }
                                        
                                        // Clear reference to avoid serialization issues
                                        sonarData = null
                                        
                                        echo '✅ SonarQube metrics retrieved:'
                                        echo "   Bugs: ${securityResults.sonarqube.bugs ?: '0'}"
                                        echo "   Vulnerabilities: ${securityResults.sonarqube.vulnerabilities ?: '0'}"
                                        echo "   Code Smells: ${securityResults.sonarqube.code_smells ?: '0'}"
                                        echo "   Security Hotspots: ${securityResults.sonarqube.security_hotspots ?: '0'}"
                                        echo "   Security Rating: ${securityResults.sonarqube.security_rating ?: 'N/A'}"
                                    } else {
                                        echo '⚠️  No metrics found in SonarQube response'
                                    }
                                } catch (Exception e) {
                                    echo "⚠️  Could not parse SonarQube metrics: ${e.message}"
                                }
                            } else {
                                echo '⚠️  No valid metrics data received from SonarQube'
                            }
                        }
                        
                        echo "🔗 SonarQube Dashboard: ${env.SONAR_HOST_URL}/dashboard?id=${env.PROJECT_KEY}"
                    }
                    
                    // ═══════════════════════════════════════════════════════
                    // Phase 2: Grype Vulnerability Scanning
                    // ═══════════════════════════════════════════════════════
                    catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                        echo ''
                        echo '🔍 Phase 2: Grype Vulnerability Scanning'
                        echo '─────────────────────────────────────────────────────'
                        
                        container('build-tools') {
                            // Install Grype on-demand
                            echo '📦 Installing Grype...'
                            sh '''
                                curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
                                grype version
                            '''
                            
                            // Run Grype scan
                            echo '🔎 Scanning for vulnerabilities...'
                            sh '''
                                cd order-service
                                grype dir:. --scope all-layers -o json > grype-report.json || true
                            '''
                            
                            // Parse results using grep and wc
                            def criticalCount = sh(
                                script: 'grep -o \'"severity":"Critical"\' order-service/grype-report.json | wc -l',
                                returnStdout: true
                            ).trim().toInteger()
                            
                            def highCount = sh(
                                script: 'grep -o \'"severity":"High"\' order-service/grype-report.json | wc -l',
                                returnStdout: true
                            ).trim().toInteger()
                            
                            def mediumCount = sh(
                                script: 'grep -o \'"severity":"Medium"\' order-service/grype-report.json | wc -l',
                                returnStdout: true
                            ).trim().toInteger()
                            
                            // Store as Integer primitives
                            securityResults.grype.critical = criticalCount
                            securityResults.grype.high = highCount
                            securityResults.grype.medium = mediumCount
                            securityResults.grype.total = criticalCount + highCount + mediumCount
                            
                            echo '✅ Grype scan completed:'
                            echo "   Critical: ${criticalCount}"
                            echo "   High: ${highCount}"
                            echo "   Medium: ${mediumCount}"
                            echo "   Total: ${securityResults.grype.total}"
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════
                    // Phase 3: CVE Analysis with Bob
                    // ═══════════════════════════════════════════════════════
                    def bobAnalysis = ''
                    if (securityResults.grype.total > 0 ||
                        (securityResults.sonarqube.vulnerabilities && securityResults.sonarqube.vulnerabilities.toInteger() > 0)) {
                        
                        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
                            echo ''
                            echo '🤖 Phase 3: Bob CVE Analysis'
                            echo '─────────────────────────────────────────────────────'
                            
                            def prompt = """Analyze the security scan results for the order-service application:

SONARQUBE RESULTS:
- Bugs: ${securityResults.sonarqube.bugs ?: '0'}
- Vulnerabilities: ${securityResults.sonarqube.vulnerabilities ?: '0'}
- Code Smells: ${securityResults.sonarqube.code_smells ?: '0'}
- Security Hotspots: ${securityResults.sonarqube.security_hotspots ?: '0'}
- Security Rating: ${securityResults.sonarqube.security_rating ?: 'N/A'}

GRYPE VULNERABILITY SCAN:
- Critical CVEs: ${securityResults.grype.critical}
- High CVEs: ${securityResults.grype.high}
- Medium CVEs: ${securityResults.grype.medium}
- Total Vulnerabilities: ${securityResults.grype.total}

Please provide:
1. Risk Assessment: Overall security posture
2. Top 3 Critical Issues: Most urgent vulnerabilities to address
3. Remediation Steps: Specific actions to fix issues
4. Deployment Recommendation: BLOCK, WARN, or PROCEED

Format your response with clear sections and end with a deployment recommendation."""
                            
                            bobAnalysis = askBob(prompt, 'code')
                            
                            echo ''
                            echo bobAnalysis
                            echo ''
                            
                            writeFile file: 'bob-cve-analysis.txt', text: bobAnalysis
                            
                            // Extract deployment recommendation
                            if (bobAnalysis.contains('BLOCK')) {
                                securityResults.deploymentDecision = 'BLOCK'
                            } else if (bobAnalysis.contains('WARN')) {
                                securityResults.deploymentDecision = 'WARN'
                            } else if (bobAnalysis.contains('PROCEED')) {
                                securityResults.deploymentDecision = 'PROCEED'
                            } else {
                                securityResults.deploymentDecision = 'REVIEW_REQUIRED'
                            }
                        }
                    } else {
                        echo ''
                        echo '✅ Phase 3: No vulnerabilities detected, skipping Bob analysis'
                        securityResults.deploymentDecision = 'PROCEED'
                    }
                    
                    // ═══════════════════════════════════════════════════════
                    // Phase 4: Risk Level Calculation
                    // ═══════════════════════════════════════════════════════
                    echo ''
                    echo '📊 Phase 4: Risk Level Calculation'
                    echo '─────────────────────────────────────────────────────'
                    
                    // Parse String values to Integer safely
                    def sonarVulns = 0
                    def sonarHotspots = 0
                    def sonarBugs = 0
                    
                    try {
                        sonarVulns = securityResults.sonarqube.vulnerabilities ?
                            Integer.parseInt(securityResults.sonarqube.vulnerabilities) : 0
                        sonarHotspots = securityResults.sonarqube.security_hotspots ?
                            Integer.parseInt(securityResults.sonarqube.security_hotspots) : 0
                        sonarBugs = securityResults.sonarqube.bugs ?
                            Integer.parseInt(securityResults.sonarqube.bugs) : 0
                    } catch (Exception e) {
                        echo "⚠️  Warning parsing SonarQube values: ${e.message}"
                    }
                    
                    // Calculate risk score
                    securityResults.riskScore = (sonarVulns * 10) +
                                                (sonarHotspots * 5) +
                                                (sonarBugs * 2) +
                                                (securityResults.grype.critical * 20) +
                                                (securityResults.grype.high * 10)
                    
                    // Determine risk level
                    if (securityResults.riskScore >= 50) {
                        securityResults.riskLevel = 'CRITICAL'
                    } else if (securityResults.riskScore >= 30) {
                        securityResults.riskLevel = 'HIGH'
                    } else if (securityResults.riskScore >= 10) {
                        securityResults.riskLevel = 'MEDIUM'
                    } else {
                        securityResults.riskLevel = 'LOW'
                    }
                    
                    echo "Risk Score: ${securityResults.riskScore}"
                    echo "Risk Level: ${securityResults.riskLevel}"
                    
                    // ═══════════════════════════════════════════════════════
                    // Phase 5: Deployment Decision
                    // ═══════════════════════════════════════════════════════
                    echo ''
                    echo '🚦 Phase 5: Deployment Decision'
                    echo '─────────────────────────────────────────────────────'
                    
                    if (securityResults.riskLevel == 'CRITICAL') {
                        echo '🛑 CRITICAL RISK: Deployment BLOCKED'
                        echo '   Manual security review required before deployment'
                        currentBuild.result = 'UNSTABLE'
                        securityResults.deploymentDecision = 'BLOCK'
                    } else if (securityResults.riskLevel == 'HIGH') {
                        echo '⚠️  HIGH RISK: Deployment requires manual review'
                        echo '   Recommend addressing vulnerabilities before production'
                        if (!securityResults.deploymentDecision) {
                            securityResults.deploymentDecision = 'WARN'
                        }
                    } else if (securityResults.riskLevel == 'MEDIUM') {
                        echo '⚡ MEDIUM RISK: Deployment approved with monitoring'
                        echo '   Address vulnerabilities in next sprint'
                        if (!securityResults.deploymentDecision) {
                            securityResults.deploymentDecision = 'PROCEED'
                        }
                    } else {
                        echo '✅ LOW RISK: Deployment approved'
                        if (!securityResults.deploymentDecision) {
                            securityResults.deploymentDecision = 'PROCEED'
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════
                    // Phase 6: Consolidated Report Generation
                    // ═══════════════════════════════════════════════════════
                    echo ''
                    echo '📝 Phase 6: Generating Consolidated Report'
                    echo '─────────────────────────────────────────────────────'
                    
                    def report = """# Security Analysis Report

## Executive Summary

**Build:** ${env.BUILD_NUMBER}
**Date:** ${new Date()}
**Risk Level:** ${securityResults.riskLevel}
**Risk Score:** ${securityResults.riskScore}
**Deployment Decision:** ${securityResults.deploymentDecision}

---

## SonarQube Analysis

| Metric | Value |
|--------|-------|
| Bugs | ${securityResults.sonarqube.bugs ?: '0'} |
| Vulnerabilities | ${securityResults.sonarqube.vulnerabilities ?: '0'} |
| Code Smells | ${securityResults.sonarqube.code_smells ?: '0'} |
| Security Hotspots | ${securityResults.sonarqube.security_hotspots ?: '0'} |
| Security Rating | ${securityResults.sonarqube.security_rating ?: 'N/A'} |
| Reliability Rating | ${securityResults.sonarqube.reliability_rating ?: 'N/A'} |

**Dashboard:** [View in SonarQube](${env.SONAR_HOST_URL}/dashboard?id=${env.PROJECT_KEY})

---

## Grype Vulnerability Scan

| Severity | Count |
|----------|-------|
| Critical | ${securityResults.grype.critical ?: 0} |
| High | ${securityResults.grype.high ?: 0} |
| Medium | ${securityResults.grype.medium ?: 0} |
| **Total** | **${securityResults.grype.total ?: 0}** |

---

## Bob CVE Analysis

${bobAnalysis ?: 'No analysis performed (no vulnerabilities detected)'}

---

## Deployment Recommendation

**Decision:** ${securityResults.deploymentDecision}

${securityResults.riskLevel == 'CRITICAL' ? '🛑 **BLOCKED** - Critical security issues must be resolved before deployment.' : ''}
${securityResults.riskLevel == 'HIGH' ? '⚠️ **WARNING** - High-risk vulnerabilities detected. Manual review recommended.' : ''}
${securityResults.riskLevel == 'MEDIUM' ? '⚡ **APPROVED WITH MONITORING** - Address issues in next sprint.' : ''}
${securityResults.riskLevel == 'LOW' ? '✅ **APPROVED** - No significant security concerns.' : ''}

---

*Generated by Jenkins Security Analysis Pipeline*
"""
                    
                    writeFile file: 'security-analysis-report.md', text: report
                    
                    echo '✅ Report generated: security-analysis-report.md'
                    
                    echo ''
                    echo "  Completed: ${new Date()}"
                    echo '════════════════════════════════════════════════════════'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'security-analysis-report.md,bob-cve-analysis.txt,order-service/grype-report.json',
                                   allowEmptyArchive: true,
                                   fingerprint: true
                }
            }
        }

        // ── Lab 1: PR / Git Diff Review ──────────────────────────
        //    Add a stage here that runs Bob in a "senior developer"
        //    mode against the git diff. See labs/LAB1_PR_REVIEW.md.

        // ── Lab 2: Unit Testing ──────────────────────────────────
        //    Add a mvn test stage + Bob test-failure analysis.
        //    See labs/LAB2_UNIT_TESTING.md.

        // ── Lab 3: Security Scanning ─────────────────────────────
        //    Add a scanner stage + Bob CVE/vuln analysis.
        //    See labs/LAB3_SECURITY_SCANNING.md.

        // ── Lab 4: Linting ───────────────────────────────────────
        //    Add a lint stage + Bob lint analysis + parse and post
        //    Jenkins report as a PR comment.
        //    See labs/LAB4_LINTING.md.

        // ── Lab 5: DCR & Reporting ───────────────────────────────
        //    Add a DCR generation stage; Bob pushes the result to
        //    Jira via the Jira MCP server.
        //    See labs/LAB5_DCR_REPORTING.md.
        
    }

    post {
        always {
            echo "=== Pipeline Complete ==="
            echo "Build URL: ${env.BUILD_URL}"
            echo "Result: ${currentBuild.result ?: 'SUCCESS'}"
        }
    }
}