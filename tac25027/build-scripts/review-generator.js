#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

/**
 * Generate review page for all banners
 * This replaces the gulp review functionality
 */
class ReviewGenerator {
  constructor() {
    this.reviewDir = '_review'
    this.packageJson = require('../package.json')
  }

  /**
   * Extract project info from package.json
   */
  getProjectInfo() {
    const nameParts = this.packageJson.name.split('-')
    return {
      year: nameParts[0] || '',
      clientCode: (nameParts[1] || '').toUpperCase(),
      jobCode: nameParts[2] || '',
      title: this.packageJson.title || 'Banner Review',
      name: this.packageJson.name
    }
  }

  /**
   * Get banner information
   */
  getBannerInfo() {
    const bannerDirs = glob.sync('banners/*/', { ignore: 'banners/_*' })
    
    return bannerDirs.map(dir => {
      const name = path.basename(dir)
      const sizeMatch = name.match(/(\d+)x(\d+)/)
      const width = sizeMatch ? sizeMatch[1] : '300'
      const height = sizeMatch ? sizeMatch[2] : '250'
      
      return {
        name,
        width: parseInt(width),
        height: parseInt(height),
        path: dir
      }
    })
  }

  /**
   * Generate review HTML page
   */
  generateReviewPage() {
    const project = this.getProjectInfo()
    const banners = this.getBannerInfo()
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title} - Banner Review</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 { margin: 0 0 10px 0; color: #333; }
        .header p { margin: 0; color: #666; }
        .banners {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
        }
        .banner-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .banner-header {
            padding: 15px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .banner-title {
            font-weight: 600;
            margin: 0 0 5px 0;
            color: #333;
        }
        .banner-size {
            color: #666;
            font-size: 14px;
            margin: 0;
        }
        .banner-preview {
            padding: 20px;
            text-align: center;
            background: #fff;
        }
        .banner-frame {
            display: inline-block;
            border: 2px solid #ddd;
            background: #f8f9fa;
            position: relative;
        }
        .banner-frame iframe {
            display: block;
            border: none;
        }
        .banner-actions {
            padding: 15px;
            text-align: center;
            background: #f8f9fa;
        }
        .btn {
            display: inline-block;
            padding: 8px 16px;
            margin: 0 5px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        .btn:hover { background: #0056b3; }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover { background: #545b62; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${project.title}</h1>
        <p>Project: ${project.name} | Generated: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="banners">
        ${banners.map(banner => `
        <div class="banner-card">
            <div class="banner-header">
                <h3 class="banner-title">${banner.name}</h3>
                <p class="banner-size">${banner.width} × ${banner.height} pixels</p>
            </div>
            <div class="banner-preview">
                <div class="banner-frame" style="width: ${banner.width}px; height: ${banner.height}px;">
                    <iframe 
                        src="${banner.path}index.html" 
                        width="${banner.width}" 
                        height="${banner.height}"
                        title="${banner.name} Preview">
                    </iframe>
                </div>
            </div>
            <div class="banner-actions">
                <a href="${banner.path}index.html" target="_blank" class="btn">View Full</a>
                <a href="${banner.path}" target="_blank" class="btn btn-secondary">View Files</a>
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>`

    // Ensure review directory exists
    if (!fs.existsSync(this.reviewDir)) {
      fs.mkdirSync(this.reviewDir, { recursive: true })
    }

    // Write review page
    const reviewPath = path.join(this.reviewDir, 'index.html')
    fs.writeFileSync(reviewPath, html)
    
    console.log(`✅ Review page generated: ${reviewPath}`)
    console.log(`📱 Found ${banners.length} banners`)
    
    return reviewPath
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ReviewGenerator()
  generator.generateReviewPage()
}

module.exports = ReviewGenerator
