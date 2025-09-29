#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')
const archiver = require('archiver')

/**
 * Deploy banners by creating zip files for distribution
 * This replaces the gulp deploy functionality
 */
class BannerDeployer {
  constructor() {
    this.deployDir = '_deploy'
    this.maxSizeKB = 500 // IAB limit is 200KB, using 500KB as buffer
  }

  /**
   * Ensure deploy directory exists
   */
  ensureDeployDir() {
    if (!fs.existsSync(this.deployDir)) {
      fs.mkdirSync(this.deployDir, { recursive: true })
    }
  }

  /**
   * Get file size in KB
   * @param {string} filePath 
   * @returns {number}
   */
  getFileSizeKB(filePath) {
    const stats = fs.statSync(filePath)
    return stats.size / 1024
  }

  /**
   * Create zip file for a banner directory
   * @param {string} bannerDir - Path to banner directory
   * @returns {Promise<string>} - Path to created zip file
   */
  async createBannerZip(bannerDir) {
    const bannerName = path.basename(bannerDir)
    const zipPath = path.join(this.deployDir, `${bannerName}.zip`)
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        const sizeKB = this.getFileSizeKB(zipPath)
        console.log(`Created ${bannerName}.zip (${sizeKB.toFixed(1)}KB)`)
        
        if (sizeKB > this.maxSizeKB) {
          console.warn(`⚠️  ${bannerName}.zip exceeds size limit (${this.maxSizeKB}KB)`)
        }
        
        resolve(zipPath)
      })

      archive.on('error', reject)
      archive.pipe(output)

      // Add banner files to zip
      archive.directory(bannerDir, false)
      archive.finalize()
    })
  }

  /**
   * Deploy all banners
   */
  async deployBanners() {
    this.ensureDeployDir()
    
    const bannerDirs = glob.sync('banners/*/', { ignore: 'banners/_*' })
    
    console.log(`Deploying ${bannerDirs.length} banners...`)
    
    const zipPromises = bannerDirs.map(dir => this.createBannerZip(dir))
    await Promise.all(zipPromises)
    
    console.log(`✅ Deployment complete! Files saved to ${this.deployDir}/`)
  }

  /**
   * Clean deploy directory
   */
  clean() {
    if (fs.existsSync(this.deployDir)) {
      fs.rmSync(this.deployDir, { recursive: true, force: true })
      console.log(`Cleaned ${this.deployDir} directory`)
    }
  }
}

// Run if called directly
if (require.main === module) {
  const deployer = new BannerDeployer()
  const command = process.argv[2]
  
  if (command === 'clean') {
    deployer.clean()
  } else {
    deployer.deployBanners().catch(console.error)
  }
}

module.exports = BannerDeployer
