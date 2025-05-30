/**
 * Test script for Advanced Security Features
 * 
 * This script demonstrates the functionality of the security services
 * including authentication, authorization, and data protection.
 */

// Import the security services
const { 
  authenticationService, 
  authorizationService, 
  dataProtectionService 
} = require('./index');
const { logger } = require('../../utils/mock-utils');

/**
 * Run the test
 */
async function runTest() {
  logger.info('=== Advanced Security Features Test ===');
  
  // Test Authentication Service
  logger.info('\n--- Authentication Service ---');
  
  // Register users
  logger.info('Registering users:');
  const adminUser = await authenticationService.registerUser({
    username: 'admin',
    email: 'admin@example.com',
    password: 'SecureP@ss123',
    fullName: 'Admin User'
  });
  
  if (adminUser.success) {
    logger.info(`Registered admin user: ${adminUser.user.username} (${adminUser.user.id})`);
  }
  
  const regularUser = await authenticationService.registerUser({
    username: 'user',
    email: 'user@example.com',
    password: 'UserP@ss456',
    fullName: 'Regular User'
  });
  
  if (regularUser.success) {
    logger.info(`Registered regular user: ${regularUser.user.username} (${regularUser.user.id})`);
  }
  
  // Authenticate users
  logger.info('\nAuthenticating users:');
  const adminAuth = await authenticationService.authenticate({
    username: 'admin',
    password: 'SecureP@ss123'
  });
  
  if (adminAuth.success) {
    logger.info(`Admin user authenticated successfully`);
    logger.info(`Access token: ${adminAuth.accessToken.substring(0, 10)}...`);
    logger.info(`Refresh token: ${adminAuth.refreshToken.substring(0, 10)}...`);
  }
  
  const userAuth = await authenticationService.authenticate({
    username: 'user',
    password: 'UserP@ss456'
  });
  
  if (userAuth.success) {
    logger.info(`Regular user authenticated successfully`);
  }
  
  // Verify token
  logger.info('\nVerifying token:');
  const tokenVerification = await authenticationService.verifyToken(adminAuth.accessToken);
  
  if (tokenVerification.success) {
    logger.info(`Token verification successful for user: ${tokenVerification.user.username}`);
  }
  
  // Setup MFA
  logger.info('\nSetting up MFA:');
  const mfaSetup = await authenticationService.setupMfa(adminUser.user.id);
  
  if (mfaSetup.success) {
    logger.info(`MFA setup initiated for admin user`);
    logger.info(`MFA Secret: ${mfaSetup.secret}`);
    logger.info(`QR Code Data: ${mfaSetup.qrCodeData.substring(0, 30)}...`);
    
    // Verify and enable MFA
    const mfaVerify = await authenticationService.verifyAndEnableMfa(adminUser.user.id, '123456');
    
    if (mfaVerify.success) {
      logger.info(`MFA verified and enabled for admin user`);
    }
  }
  
  // Get user sessions
  logger.info('\nGetting user sessions:');
  const sessions = await authenticationService.getUserSessions(adminUser.user.id);
  
  if (sessions.success) {
    logger.info(`Found ${sessions.sessions.length} active sessions for admin user`);
    sessions.sessions.forEach((session, index) => {
      logger.info(`Session ${index + 1}: ${session.id} (Created: ${session.createdAt})`);
    });
  }
  
  // Test Authorization Service
  logger.info('\n--- Authorization Service ---');
  
  // Get roles
  logger.info('Getting roles:');
  const userRole = authorizationService.getRole('user');
  const adminRole = authorizationService.getRole('admin');
  const superAdminRole = authorizationService.getRole('superadmin');
  
  if (userRole.success && adminRole.success && superAdminRole.success) {
    logger.info(`Found roles: ${userRole.role.name}, ${adminRole.role.name}, ${superAdminRole.role.name}`);
  }
  
  // Assign roles to users
  logger.info('\nAssigning roles to users:');
  const assignAdminRole = authorizationService.assignRoleToUser(adminUser.user.id, adminRole.role.id);
  
  if (assignAdminRole.success) {
    logger.info(assignAdminRole.message);
  }
  
  const assignUserRole = authorizationService.assignRoleToUser(regularUser.user.id, userRole.role.id);
  
  if (assignUserRole.success) {
    logger.info(assignUserRole.message);
  }
  
  // Check permissions
  logger.info('\nChecking permissions:');
  
  // Admin should have permission to create chatbots
  const adminCreatePermission = authorizationService.checkPermission(
    adminUser.user.id, 
    'chatbot', 
    'create'
  );
  
  if (adminCreatePermission.success) {
    logger.info(`Admin create chatbot permission: ${adminCreatePermission.authorized ? 'Granted' : 'Denied'}`);
  }
  
  // Regular user should not have permission to delete chatbots
  const userDeletePermission = authorizationService.checkPermission(
    regularUser.user.id, 
    'chatbot', 
    'delete'
  );
  
  if (userDeletePermission.success) {
    logger.info(`User delete chatbot permission: ${userDeletePermission.authorized ? 'Granted' : 'Denied'}`);
    if (!userDeletePermission.authorized) {
      logger.info(`Reason: ${userDeletePermission.reason}`);
    }
  }
  
  // Create custom role and permission
  logger.info('\nCreating custom role and permission:');
  
  const analyticsPerm = authorizationService.createPermission({
    name: 'view:analytics',
    description: 'View analytics data',
    resource: 'analytics',
    action: 'view'
  });
  
  if (analyticsPerm.success) {
    logger.info(`Created permission: ${analyticsPerm.permission.name}`);
    
    const analyticsRole = authorizationService.createRole({
      name: 'analytics_viewer',
      description: 'User who can view analytics data',
      parentRole: 'user'
    });
    
    if (analyticsRole.success) {
      logger.info(`Created role: ${analyticsRole.role.name}`);
      
      // Assign permission to role
      const assignPerm = authorizationService.assignPermissionToRole(
        analyticsRole.role.id, 
        analyticsPerm.permission.id
      );
      
      if (assignPerm.success) {
        logger.info(assignPerm.message);
        
        // Assign role to user
        const assignRole = authorizationService.assignRoleToUser(
          regularUser.user.id, 
          analyticsRole.role.id
        );
        
        if (assignRole.success) {
          logger.info(assignRole.message);
        }
      }
    }
  }
  
  // Get user permissions
  logger.info('\nGetting user permissions:');
  const userPermissions = authorizationService.getUserPermissions(regularUser.user.id);
  
  if (userPermissions.success) {
    logger.info(`User has ${userPermissions.permissions.length} permissions:`);
    userPermissions.permissions.forEach(permission => {
      logger.info(`- ${permission.name}: ${permission.resource}:${permission.action}`);
    });
  }
  
  // Test Data Protection Service
  logger.info('\n--- Data Protection Service ---');
  
  // Encrypt sensitive data
  logger.info('Encrypting sensitive data:');
  const sensitiveData = 'This is a confidential message containing a credit card: 4111-1111-1111-1111';
  
  const encryptResult = dataProtectionService.encrypt(sensitiveData, {
    purpose: 'message',
    metadata: { userId: adminUser.user.id }
  });
  
  if (encryptResult.success) {
    logger.info(`Encrypted data with ID: ${encryptResult.dataId}`);
    logger.info(`Encrypted data: ${encryptResult.encryptedData.substring(0, 20)}...`);
    
    // Decrypt data
    logger.info('\nDecrypting data:');
    const decryptResult = dataProtectionService.decrypt(encryptResult.dataId);
    
    if (decryptResult.success) {
      logger.info(`Decrypted data: ${decryptResult.data}`);
    }
  }
  
  // Hash data
  logger.info('\nHashing data:');
  const dataToHash = 'password123';
  
  const hashResult = dataProtectionService.hash(dataToHash, {
    salt: 'random-salt'
  });
  
  if (hashResult.success) {
    logger.info(`Hashed data: ${hashResult.hashedData}`);
    logger.info(`Algorithm: ${hashResult.algorithm}`);
  }
  
  // Scan for sensitive data
  logger.info('\nScanning for sensitive data:');
  const textToScan = 'Please contact john.doe@example.com or call 555-123-4567. ' +
                     'My credit card is 4111-1111-1111-1111 and my SSN is 123-45-6789.';
  
  const scanResult = dataProtectionService.scanForSensitiveData(textToScan);
  
  if (scanResult.success) {
    logger.info(`Found ${scanResult.findings.length} types of sensitive data:`);
    scanResult.findings.forEach(finding => {
      logger.info(`- ${finding.dataType}: ${finding.count} instances`);
      logger.info(`  Samples: ${finding.samples.join(', ')}`);
    });
    
    // Redact sensitive data
    logger.info('\nRedacting sensitive data:');
    const redactResult = dataProtectionService.redactSensitiveData(textToScan);
    
    if (redactResult.success) {
      logger.info(`Redacted ${redactResult.redactions.length} instances of sensitive data`);
      logger.info(`Redacted text: ${redactResult.redactedText}`);
    }
  }
  
  // Logout
  logger.info('\nLogging out:');
  const logoutResult = await authenticationService.logout(adminAuth.accessToken);
  
  if (logoutResult.success) {
    logger.info(logoutResult.message);
  }
  
  logger.info('\n=== Test Complete ===');
  logger.info('The Advanced Security Features are ready for use in the chatbot platform.');
  logger.info('Key features demonstrated:');
  logger.info('1. User authentication with password policies');
  logger.info('2. Multi-factor authentication');
  logger.info('3. Session management');
  logger.info('4. Role-based access control');
  logger.info('5. Permission management');
  logger.info('6. Data encryption and decryption');
  logger.info('7. Sensitive data detection and masking');
}

// Run the test
runTest().catch(error => {
  logger.error('Test failed with error:', error);
});
