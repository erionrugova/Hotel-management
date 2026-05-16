$ErrorActionPreference = 'Stop'
$logPath = Join-Path $PSScriptRoot 'install-environment-actions.log'
if (Test-Path $logPath) { Remove-Item $logPath -Force }

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Message"
    Write-Host $line
    Add-Content -Path $logPath -Value $line
}

Write-Log "Starting environment setup..."

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Log "winget is not available on this machine. Please install winget or use manual installation."
    exit 1
}

Write-Log "Checking winget availability..."
winget --version | Out-Host

function Install-PackageIfMissing {
    param(
        [string]$PackageId,
        [string]$PackageName
    )

    $installed = winget list --id $PackageId 2>$null | Select-String $PackageId
    if (-not $installed) {
        Write-Log "Installing $PackageName ($PackageId)..."
        winget install --id $PackageId -e --accept-package-agreements --accept-source-agreements
    } else {
        Write-Log "$PackageName already installed."
    }
}

Install-PackageIfMissing -PackageId "Docker.DockerDesktop" -PackageName "Docker Desktop"

$mysqlPackageCandidates = @(
    @{ Id = "Oracle.MySQLServer"; Name = "MySQL Server" },
    @{ Id = "Oracle.MySQL"; Name = "MySQL" },
    @{ Id = "MySQL.MySQLServer"; Name = "MySQL Server" },
    @{ Id = "MariaDB.MariaDB"; Name = "MariaDB" }
)

$mysqlInstalled = $false
foreach ($candidate in $mysqlPackageCandidates) {
    try {
        $installed = winget list --id $candidate.Id 2>$null | Select-String $candidate.Id
        if ($installed) {
            Write-Log "$($candidate.Name) ($($candidate.Id)) already installed."
            $mysqlInstalled = $true
            break
        }
    } catch {
        # ignore
    }
}

if (-not $mysqlInstalled) {
    Write-Log "Installing MySQL or MariaDB..."
    $success = $false
    foreach ($candidate in $mysqlPackageCandidates) {
        try {
            Write-Log "Trying package $($candidate.Name) ($($candidate.Id))..."
            winget install --id $candidate.Id -e --accept-package-agreements --accept-source-agreements
            $success = $true
            break
        } catch {
            Write-Log "Failed to install $($candidate.Name) ($($candidate.Id)); trying next candidate."
        }
    }
    if (-not $success) {
        Write-Log "Unable to install MySQL/MariaDB automatically. Please install one manually."
        exit 1
    }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Log "Creating server .env file if missing..."
$envPath = Join-Path $root "server\.env"
if (-not (Test-Path $envPath)) {
    @"
DATABASE_URL=mysql://hotel_user:hotel_password@localhost:3306/hotel_management
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
PORT=3000
ENABLE_RATE_LIMIT=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
"@ | Set-Content -Path $envPath -Encoding UTF8
    Write-Log "Created server .env file."
} else {
    Write-Log "server .env already exists."
}

Write-Log "Installing npm dependencies..."
npm install
npm run install-all

Write-Log "Generating Prisma client..."
Set-Location (Join-Path $root "server")
npx prisma generate

Write-Log "Environment setup completed successfully."
