const fs = require('fs');
const path = require('path');

class DataPersistence {
  constructor() {
    this.dataFile = path.join(__dirname, 'jetbond-data.json');
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const fileData = fs.readFileSync(this.dataFile, 'utf8');
        const parsed = JSON.parse(fileData);
        return {
          users: new Map(Object.entries(parsed.users || {})),
          jobs: new Map(Object.entries(parsed.jobs || {}))
        };
      }
    } catch (error) {
      console.log('Could not load data file, starting fresh');
    }
    return { users: new Map(), jobs: new Map() };
  }

  saveData() {
    try {
      const dataToSave = {
        users: Object.fromEntries(this.data.users),
        jobs: Object.fromEntries(this.data.jobs),
        lastSaved: new Date().toISOString()
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(dataToSave, null, 2));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  getUsers() { return this.data.users; }
  getJobs() { return this.data.jobs; }
}

module.exports = DataPersistence;