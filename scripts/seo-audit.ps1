# ==============================================================================
# Mushi Creativo - Automated Pre-Deployment SEO & Quality Assurance Engine
# MD Mushfiqur Rahman Robaet | Canonical: https://mushicreativo.netlify.app/
# ==============================================================================

param(
    [string]$WorkspaceRoot = $PSScriptRoot + "\.."
)

$ErrorActionPreference = "Continue"
$root = (Resolve-Path $WorkspaceRoot).Path
$canonicalDomain = "https://mushicreativo.netlify.app"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   MUSHI CREATIVO - AUTOMATED SEO AUDIT & CI VALIDATION SUITE    " -ForegroundColor Cyan
Write-Host "   Root: $root" -ForegroundColor Gray
Write-Host "   Canonical Domain: $canonicalDomain" -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0
$failures = @()

function Assert-Check {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        if ($Details) {
            Write-Host "         Reason: $Details" -ForegroundColor Yellow
        }
        $script:testsFailed++
        $script:failures += "$($Name) - $Details"
    }
}

# ------------------------------------------------------------------------------
# 1. Core Build & Routing Files
# ------------------------------------------------------------------------------
Write-Host "[1/9] Verifying Core Files & Netlify Routing Directives..." -ForegroundColor Yellow
$coreFiles = @("index.html", "404.html", "sitemap.xml", "robots.txt", "_headers", "_redirects", "css\styles.css", "js\main.js")
foreach ($cf in $coreFiles) {
    $exists = Test-Path (Join-Path $root $cf)
    Assert-Check "Core file exists: $cf" $exists "File not found in repository root"
}

# ------------------------------------------------------------------------------
# 2. Netlify Redirect Rules & Security Headers
# ------------------------------------------------------------------------------
Write-Host "`n[2/9] Auditing Netlify Directives & Security Headers..." -ForegroundColor Yellow
$redirectsContent = Get-Content (Join-Path $root "_redirects") -Raw
Assert-Check "301 Redirect for legacy /on-page-seo/" ($redirectsContent -match "/on-page-seo/\s+/blogs/\s+301!") "Missing legacy 301 rule"
Assert-Check "Custom 404 rule configured in _redirects" ($redirectsContent -match "/\*\s+/404\.html\s+404") "Missing custom 404 rule"

$headersContent = Get-Content (Join-Path $root "_headers") -Raw
Assert-Check "HSTS Header configured" ($headersContent -match "Strict-Transport-Security") "Missing HSTS in _headers"
Assert-Check "X-Frame-Options: DENY configured" ($headersContent -match "X-Frame-Options:\s+DENY") "Missing X-Frame-Options"
Assert-Check "Cache-Control revalidation for unversioned CSS/JS" ($headersContent -match "stale-while-revalidate") "Missing stale-while-revalidate caching"

# ------------------------------------------------------------------------------
# 3. HTML Metadata & Canonical URLs
# ------------------------------------------------------------------------------
Write-Host "`n[3/9] Auditing HTML Metadata, Titles & Canonical URLs..." -ForegroundColor Yellow
$htmlFiles = Get-ChildItem -Path $root -Recurse -Filter "*.html" | Where-Object { $_.FullName -notmatch '\\\.git\\' }
$seenTitles = @{}
$seenDescriptions = @{}

foreach ($f in $htmlFiles) {
    $rel = $f.FullName.Replace($root, "").TrimStart("\", "/")
    $content = Get-Content -Path $f.FullName -Raw
    
    # 404 and on-page-seo are non-indexable
    if ($rel -eq "404.html" -or $rel -match "^on-page-seo") {
        Assert-Check "[$rel] Carries noindex directive" ($content -match '<meta\s+name=["'']robots["'']\s+content=["''][^"'']*noindex') "Expected noindex directive"
        continue
    }

    # Title check
    $hasTitle = $content -match '<title>([^<]+)</title>'
    $title = if ($hasTitle) { $matches[1].Trim() } else { "" }
    Assert-Check "[$rel] Has valid title" ($hasTitle -and $title.Length -gt 15) "Title is missing or too short ($title)"
    
    if ($title) {
        if ($seenTitles.ContainsKey($title)) {
            Assert-Check "[$rel] Unique title check" $false "Duplicate title found with $($seenTitles[$title])"
        } else {
            $seenTitles[$title] = $rel
        }
    }

    # Meta description check
    $hasDesc = $content -match '<meta\s+name=["'']description["'']\s+content=["'']([^"'']+)["'']'
    $desc = if ($hasDesc) { $matches[1].Trim() } else { "" }
    Assert-Check "[$rel] Has meta description" ($hasDesc -and $desc.Length -gt 50) "Description missing or too short ($desc)"

    # Canonical check
    $hasCanonical = $content -match '<link\s+rel=["'']canonical["'']\s+href=["'']([^"'']+)["'']'
    $canonical = if ($hasCanonical) { $matches[1].Trim() } else { "" }
    Assert-Check "[$rel] Has canonical URL pointing to $canonicalDomain" ($canonical.StartsWith($canonicalDomain)) "Canonical is invalid ($canonical)"

    # H1 check
    $hasH1 = $content -match '<h1[^>]*>([\s\S]*?)</h1>'
    Assert-Check "[$rel] Has single H1 heading" ($hasH1) "Page lacks an H1 tag"
}

# ------------------------------------------------------------------------------
# 4. JSON-LD Schema Validation
# ------------------------------------------------------------------------------
Write-Host "`n[4/9] Validating JSON-LD Structured Data Schemas..." -ForegroundColor Yellow
foreach ($f in $htmlFiles) {
    $rel = $f.FullName.Replace($root, "").TrimStart("\", "/")
    $content = Get-Content -Path $f.FullName -Raw
    $schemaMatches = [regex]::Matches($content, '<script\s+type=["'']application/ld\+json["'']>([\s\S]*?)</script>', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    foreach ($sm in $schemaMatches) {
        $jsonStr = $sm.Groups[1].Value.Trim()
        $isValidJson = $true
        try {
            $parsed = ConvertFrom-Json $jsonStr
        } catch {
            $isValidJson = $false
        }
        Assert-Check "[$rel] JSON-LD block syntax is valid" $isValidJson "JSON parsing error in $rel"

        if ($isValidJson) {
            # Check canonical domain in schema
            $hasCorrectDomain = $jsonStr -match [regex]::Escape($canonicalDomain)
            Assert-Check "[$rel] Schema @id / url matches canonical domain" $hasCorrectDomain "Schema contains external or outdated domain"
        }
    }
}

# ------------------------------------------------------------------------------
# 5. Internal Links & Anchor Resolution
# ------------------------------------------------------------------------------
Write-Host "`n[5/9] Crawling Internal Links & Anchor Targets..." -ForegroundColor Yellow
$brokenLinks = @()
foreach ($f in $htmlFiles) {
    $rel = $f.FullName.Replace($root, "").TrimStart("\", "/")
    $content = Get-Content -Path $f.FullName -Raw
    $links = [regex]::Matches($content, 'href=["'']([^"'']+)["'']')
    
    foreach ($l in $links) {
        $val = $l.Groups[1].Value.Trim()
        if ($val -like "http*" -or $val -like "mailto:*" -or $val -like "tel:*" -or $val -like "javascript:*") {
            continue
        }
        
        $target = $val
        if ($target.Contains("#")) {
            $target = $target.Substring(0, $target.IndexOf("#"))
        }
        
        if ([string]::IsNullOrWhiteSpace($target)) {
            continue
        }
        
        $resolved = if ($target.StartsWith("/")) {
            Join-Path $root $target.TrimStart("/")
        } else {
            Join-Path (Split-Path $f.FullName) $target
        }
        
        if (Test-Path $resolved -PathType Container) {
            $resolved = Join-Path $resolved "index.html"
        }
        
        if (-not (Test-Path $resolved)) {
            $brokenLinks += "[$rel] -> '$val' (Path does not exist: $resolved)"
        }
    }
}
Assert-Check "Zero broken internal links across all pages" ($brokenLinks.Count -eq 0) ($brokenLinks -join "; ")

# ------------------------------------------------------------------------------
# 6. Static Media & Asset Integrity
# ------------------------------------------------------------------------------
Write-Host "`n[6/9] Validating Static Assets (Images, Favicons, Styles)..." -ForegroundColor Yellow
$brokenAssets = @()
$missingAlts = @()

foreach ($f in $htmlFiles) {
    $rel = $f.FullName.Replace($root, "").TrimStart("\", "/")
    $content = Get-Content -Path $f.FullName -Raw
    
    $imgs = [regex]::Matches($content, '<img([^>]+)>')
    foreach ($im in $imgs) {
        $attrs = $im.Groups[1].Value
        
        # Alt check
        if ($attrs -notmatch '\balt\s*=') {
            $missingAlts += "[$rel] Image tag missing alt: $($im.Value)"
        }
        
        # Source resolution check
        if ($attrs -match 'src=["'']([^"'']+)["'']') {
            $src = $matches[1].Trim()
            if ($src -notlike "http*" -and $src -notlike "data:*") {
                $resolved = if ($src.StartsWith("/")) { Join-Path $root $src.TrimStart("/") } else { Join-Path $f.DirectoryName $src }
                if (-not (Test-Path $resolved -PathType Leaf)) {
                    $brokenAssets += "[$rel] Missing image file: $src"
                }
            }
        }
    }
}
Assert-Check "Zero broken image assets" ($brokenAssets.Count -eq 0) ($brokenAssets -join "; ")
Assert-Check "100% of images have descriptive alt attributes" ($missingAlts.Count -eq 0) ($missingAlts -join "; ")

# ------------------------------------------------------------------------------
# 7. XML Sitemap & Robots.txt Compliance
# ------------------------------------------------------------------------------
Write-Host "`n[7/9] Auditing sitemap.xml & robots.txt..." -ForegroundColor Yellow
$sitemapPath = Join-Path $root "sitemap.xml"
$sitemapXml = [xml](Get-Content $sitemapPath -Raw)
$sitemapUrls = $sitemapXml.urlset.url

Assert-Check "Sitemap has indexable URLs" ($sitemapUrls.Count -ge 5) "Found only $($sitemapUrls.Count) URLs"

$sitemapErrors = @()
foreach ($u in $sitemapUrls) {
    $loc = $u.loc.Trim()
    if (-not $loc.StartsWith($canonicalDomain)) {
        $sitemapErrors += "URL does not match canonical: $loc"
    }
    if ($u.lastmod -ne "2026-11-08") {
        $sitemapErrors += "Stale lastmod on $($loc) - $($u.lastmod)"
    }
}
Assert-Check "All sitemap URLs match canonical domain ($canonicalDomain)" ($sitemapErrors.Count -eq 0) ($sitemapErrors -join "; ")

$robotsContent = Get-Content (Join-Path $root "robots.txt") -Raw
Assert-Check "Robots.txt points to canonical sitemap" ($robotsContent -match "Sitemap:\s+$canonicalDomain/sitemap\.xml") "Robots.txt sitemap directive mismatch"

# ------------------------------------------------------------------------------
# 8. Unverified Domain Leak Check
# ------------------------------------------------------------------------------
Write-Host "`n[8/9] Scanning for Leaked Unverified Domains (robaet.dev)..." -ForegroundColor Yellow
$leakedFiles = @()
$allRepoFiles = Get-ChildItem -Path $root -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch 'seo-audit\.ps1' -and $_.FullName -notmatch 'MASTER_SEO_OVERHAUL_REPORT\.md' }
foreach ($rf in $allRepoFiles) {
    $match = Select-String -Path $rf.FullName -Pattern "robaet\.dev"
    if ($match) {
        $leakedFiles += $rf.FullName.Replace($root, "")
    }
}
Assert-Check "Zero occurrences of robaet.dev in website codebase" ($leakedFiles.Count -eq 0) ("Found in: " + ($leakedFiles -join ", "))

# ------------------------------------------------------------------------------
# 9. Google Analytics 4 Safety Check
# ------------------------------------------------------------------------------
Write-Host "`n[9/9] Verifying GA4 Empty-ID Safety & Resilience..." -ForegroundColor Yellow
$mainJs = Get-Content (Join-Path $root "js\main.js") -Raw
Assert-Check "GA4 regex guard prevents execution with empty ID" ($mainJs -match '/\^G-\[A-Za-z0-9\]\+\$/') "Missing regex guard for GA4 ID"
Assert-Check "trackAnalyticsEvent handles undefined gtag safely" ($mainJs -match 'typeof window\.gtag === .function.') "Missing safety guard in trackAnalyticsEvent"

# ------------------------------------------------------------------------------
# SUMMARY & EXIT STATUS
# ------------------------------------------------------------------------------
Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "                       AUDIT SUMMARY                              " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Passed Checks: $testsPassed" -ForegroundColor Green
Write-Host "Failed Checks: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`nSTATUS: ALL SEO & TECHNICAL CHECKS PASSED WITH 100% SUCCESS!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSTATUS: $testsFailed CHECKS FAILED. PLEASE REVIEW FAILURES ABOVE." -ForegroundColor Red
    exit 1
}
