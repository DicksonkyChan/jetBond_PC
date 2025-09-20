# JetBond Server Control Scripts

## 🚀 **Quick Start**

### **Windows Batch Script (Simple)**
```cmd
# Start server
server-control.bat start

# Stop server  
server-control.bat stop

# Restart server
server-control.bat restart

# Clean all processes and start fresh
server-control.bat clean
```

### **PowerShell Script (Advanced)**
```powershell
# Start server
.\server-control.ps1 start

# Stop server
.\server-control.ps1 stop

# Restart server
.\server-control.ps1 restart

# Clean processes and start fresh
.\server-control.ps1 clean

# Check server status
.\server-control.ps1 status
```

## 📋 **Available Commands**

| Command | Batch | PowerShell | Description |
|---------|-------|------------|-------------|
| **start** | ✅ | ✅ | Start the JetBond server |
| **stop** | ✅ | ✅ | Stop the JetBond server |
| **restart** | ✅ | ✅ | Stop and start the server |
| **clean** | ✅ | ✅ | Kill all node processes and start fresh |
| **status** | ❌ | ✅ | Check if server is running |

## 🔧 **Features**

### **Batch Script (`server-control.bat`)**
- ✅ Simple Windows batch commands
- ✅ Kills existing node processes
- ✅ Starts server in new window
- ✅ 2-second delay between stop/start
- ✅ Error handling for missing processes

### **PowerShell Script (`server-control.ps1`)**
- ✅ Colored console output
- ✅ Process ID tracking
- ✅ Status checking
- ✅ Advanced process management
- ✅ Server URL display
- ✅ Better error messages

## 🎯 **Usage Examples**

### **Development Workflow**
```cmd
# Clean start for testing
server-control.bat clean

# Quick restart after code changes
server-control.bat restart

# Check if server is running (PowerShell only)
.\server-control.ps1 status
```

### **Troubleshooting**
```cmd
# If server is stuck or not responding
server-control.bat clean

# If multiple node processes are running
.\server-control.ps1 clean
```

## 🚨 **Important Notes**

### **Process Management**
- Scripts kill **ALL** node.exe processes
- Use `clean` command if server becomes unresponsive
- Server starts on port 8080 by default
- New server window opens for monitoring

### **Permissions**
- Batch script: No special permissions needed
- PowerShell script: May require execution policy change:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### **Server Monitoring**
- Server logs appear in new command window
- Press `Ctrl+C` in server window to stop manually
- Use scripts for automated management

## 🔄 **Recommended Workflow**

1. **Development**: Use `restart` for quick code changes
2. **Testing**: Use `clean` for fresh environment
3. **Debugging**: Use `status` to check server state
4. **Production**: Use `start` for initial deployment

## 🛠️ **Customization**

### **Change Server Port**
Edit `server-local.js`:
```javascript
const port = process.env.PORT || 8080; // Change 8080 to desired port
```

### **Add Custom Commands**
Extend scripts with additional commands:
- `logs` - View server logs
- `test` - Run server tests
- `deploy` - Deploy to production

## ✅ **Quick Reference**

| Need | Command |
|------|---------|
| Start fresh | `server-control.bat clean` |
| Quick restart | `server-control.bat restart` |
| Check status | `.\server-control.ps1 status` |
| Stop everything | `server-control.bat stop` |