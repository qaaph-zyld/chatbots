/**
 * GitHub Repository Synchronization Utility
 * 
 * This script ensures that local and remote GitHub repositories are in sync.
 * It checks for uncommitted changes, unpushed commits, and remote changes
 * that need to be pulled.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Repository Synchronization Utility
 */
class RepoSyncUtility {
  /**
   * Create a new repository synchronization utility
   * @param {Object} options - Options
   */
  constructor(options = {}) {
    this.options = {
      repoPath: options.repoPath || process.cwd(),
      remote: options.remote || 'origin',
      branch: options.branch || 'main',
      autoFix: options.autoFix || false,
      verbose: options.verbose !== false,
      timeout: options.timeout || 30000, // 30 seconds
      logger: options.logger || console,
      ...options
    };
    
    // Check if repo path exists
    if (!fs.existsSync(this.options.repoPath)) {
      throw new Error(`Repository path does not exist: ${this.options.repoPath}`);
    }
  }
  
  /**
   * Run a git command
   * @private
   * @param {string} command - Git command
   * @returns {string} Command output
   */
  _runGitCommand(command) {
    try {
      return execSync(`git ${command}`, {
        cwd: this.options.repoPath,
        encoding: 'utf8',
        timeout: this.options.timeout
      }).trim();
    } catch (error) {
      this.options.logger.error(`Error running git command: ${command}`);
      this.options.logger.error(error.message);
      
      if (error.stdout) {
        this.options.logger.error(`stdout: ${error.stdout}`);
      }
      
      if (error.stderr) {
        this.options.logger.error(`stderr: ${error.stderr}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Check if git repository exists
   * @returns {boolean} Whether git repository exists
   */
  isGitRepo() {
    try {
      this._runGitCommand('rev-parse --is-inside-work-tree');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get current branch
   * @returns {string} Current branch name
   */
  getCurrentBranch() {
    return this._runGitCommand('rev-parse --abbrev-ref HEAD');
  }
  
  /**
   * Check if working directory is clean
   * @returns {boolean} Whether working directory is clean
   */
  isWorkingDirectoryClean() {
    try {
      const status = this._runGitCommand('status --porcelain');
      return status === '';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get uncommitted changes
   * @returns {Array<string>} Uncommitted changes
   */
  getUncommittedChanges() {
    try {
      const status = this._runGitCommand('status --porcelain');
      
      if (status === '') {
        return [];
      }
      
      return status.split('\n').map(line => {
        const statusCode = line.substring(0, 2);
        const filePath = line.substring(3);
        
        return {
          statusCode,
          filePath
        };
      });
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Check if there are unpushed commits
   * @returns {boolean} Whether there are unpushed commits
   */
  hasUnpushedCommits() {
    try {
      const result = this._runGitCommand(`log ${this.options.remote}/${this.options.branch}..HEAD --oneline`);
      return result !== '';
    } catch (error) {
      // If remote branch doesn't exist yet, consider it as having unpushed commits
      if (error.message.includes(`${this.options.remote}/${this.options.branch}`)) {
        return true;
      }
      
      throw error;
    }
  }
  
  /**
   * Get unpushed commits
   * @returns {Array<Object>} Unpushed commits
   */
  getUnpushedCommits() {
    try {
      const result = this._runGitCommand(`log ${this.options.remote}/${this.options.branch}..HEAD --pretty=format:"%h|%an|%s"`);
      
      if (result === '') {
        return [];
      }
      
      return result.split('\n').map(line => {
        const [hash, author, subject] = line.split('|');
        
        return {
          hash,
          author,
          subject
        };
      });
    } catch (error) {
      // If remote branch doesn't exist yet, return empty array
      if (error.message.includes(`${this.options.remote}/${this.options.branch}`)) {
        return [];
      }
      
      return [];
    }
  }
  
  /**
   * Check if there are unpulled changes
   * @returns {boolean} Whether there are unpulled changes
   */
  hasUnpulledChanges() {
    try {
      // Fetch latest changes
      this._runGitCommand(`fetch ${this.options.remote}`);
      
      const result = this._runGitCommand(`log HEAD..${this.options.remote}/${this.options.branch} --oneline`);
      return result !== '';
    } catch (error) {
      // If remote branch doesn't exist yet, consider it as not having unpulled changes
      if (error.message.includes(`${this.options.remote}/${this.options.branch}`)) {
        return false;
      }
      
      throw error;
    }
  }
  
  /**
   * Get unpulled changes
   * @returns {Array<Object>} Unpulled changes
   */
  getUnpulledChanges() {
    try {
      // Fetch latest changes
      this._runGitCommand(`fetch ${this.options.remote}`);
      
      const result = this._runGitCommand(`log HEAD..${this.options.remote}/${this.options.branch} --pretty=format:"%h|%an|%s"`);
      
      if (result === '') {
        return [];
      }
      
      return result.split('\n').map(line => {
        const [hash, author, subject] = line.split('|');
        
        return {
          hash,
          author,
          subject
        };
      });
    } catch (error) {
      // If remote branch doesn't exist yet, return empty array
      if (error.message.includes(`${this.options.remote}/${this.options.branch}`)) {
        return [];
      }
      
      return [];
    }
  }
  
  /**
   * Check if repositories are in sync
   * @returns {Object} Sync status
   */
  checkSync() {
    if (!this.isGitRepo()) {
      return {
        inSync: false,
        error: 'Not a git repository'
      };
    }
    
    const currentBranch = this.getCurrentBranch();
    
    if (currentBranch !== this.options.branch) {
      return {
        inSync: false,
        error: `Not on ${this.options.branch} branch (currently on ${currentBranch})`
      };
    }
    
    const isClean = this.isWorkingDirectoryClean();
    const uncommittedChanges = this.getUncommittedChanges();
    const hasUnpushed = this.hasUnpushedCommits();
    const unpushedCommits = this.getUnpushedCommits();
    const hasUnpulled = this.hasUnpulledChanges();
    const unpulledChanges = this.getUnpulledChanges();
    
    const inSync = isClean && !hasUnpushed && !hasUnpulled;
    
    return {
      inSync,
      currentBranch,
      isClean,
      uncommittedChanges,
      hasUnpushedCommits: hasUnpushed,
      unpushedCommits,
      hasUnpulledChanges: hasUnpulled,
      unpulledChanges
    };
  }
  
  /**
   * Synchronize repositories
   * @returns {Object} Sync result
   */
  sync() {
    const status = this.checkSync();
    
    if (status.inSync) {
      if (this.options.verbose) {
        this.options.logger.info('Repositories are already in sync');
      }
      
      return {
        success: true,
        message: 'Repositories are already in sync'
      };
    }
    
    if (!this.options.autoFix) {
      return {
        success: false,
        message: 'Repositories are not in sync',
        status
      };
    }
    
    try {
      // Handle uncommitted changes
      if (!status.isClean) {
        if (this.options.verbose) {
          this.options.logger.info('Committing changes...');
        }
        
        this._runGitCommand('add .');
        this._runGitCommand('commit -m "Auto-commit: Sync repositories"');
      }
      
      // Handle unpulled changes
      if (status.hasUnpulledChanges) {
        if (this.options.verbose) {
          this.options.logger.info('Pulling changes...');
        }
        
        this._runGitCommand(`pull ${this.options.remote} ${this.options.branch}`);
      }
      
      // Handle unpushed commits
      if (status.hasUnpushedCommits) {
        if (this.options.verbose) {
          this.options.logger.info('Pushing changes...');
        }
        
        this._runGitCommand(`push ${this.options.remote} ${this.options.branch}`);
      }
      
      return {
        success: true,
        message: 'Repositories synchronized successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Error synchronizing repositories: ${error.message}`,
        error
      };
    }
  }
}

/**
 * Create a repository synchronization utility
 * @param {Object} options - Options
 * @returns {RepoSyncUtility} Repository synchronization utility
 */
function createRepoSyncUtility(options = {}) {
  return new RepoSyncUtility(options);
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--repo' || arg === '-r') {
      options.repoPath = args[++i];
    } else if (arg === '--remote') {
      options.remote = args[++i];
    } else if (arg === '--branch' || arg === '-b') {
      options.branch = args[++i];
    } else if (arg === '--auto-fix' || arg === '-a') {
      options.autoFix = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.verbose = false;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Repository Synchronization Utility

Usage:
  node sync-repositories.js [options]

Options:
  --repo, -r <path>     Repository path (default: current directory)
  --remote <name>       Remote name (default: origin)
  --branch, -b <name>   Branch name (default: main)
  --auto-fix, -a        Automatically fix sync issues
  --quiet, -q           Suppress verbose output
  --help, -h            Show this help message
      `);
      process.exit(0);
    }
  }
  
  const syncUtility = createRepoSyncUtility(options);
  
  try {
    const status = syncUtility.checkSync();
    
    if (status.inSync) {
      console.log('✅ Repositories are in sync');
    } else {
      console.log('❌ Repositories are not in sync');
      
      if (!status.isClean && Array.isArray(status.uncommittedChanges)) {
        console.log('\nUncommitted changes:');
        status.uncommittedChanges.forEach(change => {
          console.log(`  ${change.statusCode} ${change.filePath}`);
        });
      }
      
      if (status.hasUnpushedCommits && Array.isArray(status.unpushedCommits)) {
        console.log('\nUnpushed commits:');
        status.unpushedCommits.forEach(commit => {
          console.log(`  ${commit.hash} ${commit.subject} (${commit.author})`);
        });
      }
      
      if (status.hasUnpulledChanges && Array.isArray(status.unpulledChanges)) {
        console.log('\nUnpulled changes:');
        status.unpulledChanges.forEach(commit => {
          console.log(`  ${commit.hash} ${commit.subject} (${commit.author})`);
        });
      }
      
      if (options.autoFix) {
        console.log('\nAttempting to fix sync issues...');
        const result = syncUtility.sync();
        
        if (result.success) {
          console.log('✅ ' + result.message);
        } else {
          console.error('❌ ' + result.message);
          process.exit(1);
        }
      } else {
        console.log('\nRun with --auto-fix to attempt to fix these issues');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  RepoSyncUtility,
  createRepoSyncUtility
};
