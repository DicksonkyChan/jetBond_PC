param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "clean", "status")]
    [string]$Action = "help"
)

function Show-Help {
    Write-Host "JetBond Server Control Script" -ForegroundColor Cyan
    Write-Host "Usage: .\server-control.ps1 [start|stop|restart|clean|status]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Green
    Write-Host "  start   - Start the JetBond server"
    Write-Host "  stop    - Stop the JetBond server"
    Write-Host "  restart - Stop and start the server"
    Write-Host "  clean   - Kill all node processes and start fresh"
    Write-Host "  status  - Check server status"
    Write-Host ""
}

function Get-ServerStatus {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "✅ Server is running (PID: $($nodeProcesses.Id -join ', '))" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Server is not running" -ForegroundColor Red
        return $false
    }
}

function Start-Server {
    Write-Host "🚀 Starting JetBond server..." -ForegroundColor Cyan
    
    if (Get-ServerStatus) {
        Write-Host "⚠️  Server is already running" -ForegroundColor Yellow
        return
    }
    
    Start-Process -FilePath "node" -ArgumentList "server-local.js" -WindowStyle Normal
    Start-Sleep -Seconds 2
    
    if (Get-ServerStatus) {
        Write-Host "✅ Server started successfully" -ForegroundColor Green
        Write-Host "🌐 Server running at: http://localhost:8080" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to start server" -ForegroundColor Red
    }
}

function Stop-Server {
    Write-Host "🛑 Stopping JetBond server..." -ForegroundColor Cyan
    
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ Server stopped successfully" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  No server processes found" -ForegroundColor Yellow
    }
}

function Clean-Processes {
    Write-Host "🧹 Cleaning all node processes..." -ForegroundColor Cyan
    
    # Kill all node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Kill any cmd windows with JetBond in title
    Get-Process -Name "cmd" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*JetBond*" } | Stop-Process -Force
    
    Write-Host "✅ All processes cleaned" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

function Restart-Server {
    Write-Host "🔄 Restarting JetBond server..." -ForegroundColor Cyan
    Stop-Server
    Start-Sleep -Seconds 2
    Start-Server
}

# Main execution
switch ($Action) {
    "start" { Start-Server }
    "stop" { Stop-Server }
    "restart" { Restart-Server }
    "clean" { 
        Clean-Processes
        Start-Server
    }
    "status" { Get-ServerStatus }
    default { Show-Help }
}