'use client';

import { useState } from 'react';
import styles from './admin.module.css';

export default function AdminPage() {
  // State for form values
  const [wlCredentials, setWlCredentials] = useState({
    applicationId: '',
    secretCode: ''
  });
  
  const [ghlCredentials, setGhlCredentials] = useState({
    apiKey: '',
    locationId: ''
  });
  
  const [syncSettings, setSyncSettings] = useState({
    syncClients: true,
    syncAppointments: true,
    syncClasses: true,
    syncMemberships: true,
    syncDirection: 'bidirectional',
    syncFrequency: 'every15min'
  });
  
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'not_tested',
    message: 'Connection not tested yet'
  });
  
  // Handler functions
  const handleWlCredentialsChange = (e) => {
    setWlCredentials({
      ...wlCredentials,
      [e.target.name]: e.target.value
    });
  };
  
  const handleGhlCredentialsChange = (e) => {
    setGhlCredentials({
      ...ghlCredentials,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSyncSettingsChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSyncSettings({
      ...syncSettings,
      [e.target.name]: value
    });
  };
  
  const handleTestConnection = async () => {
    setConnectionStatus({
      status: 'testing',
      message: 'Testing connection...'
    });
    
    // In a real implementation, this would call your API
    // For now, we'll simulate a successful connection after a delay
    setTimeout(() => {
      setConnectionStatus({
        status: 'success',
        message: 'Connection successful!'
      });
    }, 1500);
  };
  
  const handleSaveSettings = () => {
    // In a real implementation, this would save to your database
    alert('Settings saved successfully!');
  };
  
  const handleRunSync = () => {
    // In a real implementation, this would trigger a sync
    alert('Manual sync initiated!');
  };
  
  // New handlers for the View Sync History and View Error Logs buttons
  const handleViewSyncHistory = () => {
    alert('Sync history feature will be available in the next version.');
  };

  const handleViewErrorLogs = () => {
    alert('Error logs feature will be available in the next version.');
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>WellnessLiving to GoHighLevel Integration</h1>
      
      <section className={styles.section}>
        <h2>Authentication Settings</h2>
        <div className={styles.card}>
          <h3>WellnessLiving Credentials</h3>
          <div className={styles.formGroup}>
            <label htmlFor="applicationId">
              WL Business ID:
              <span className={styles.helpText}>(The k_business value provided by WellnessLiving)</span>
            </label>
            <input
              type="text"
              id="applicationId"
              name="applicationId"
              value={wlCredentials.applicationId}
              onChange={handleWlCredentialsChange}
              className={styles.input}
              placeholder="e.g., 50312"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="secretCode">
              WL API Key:
              <span className={styles.helpText}>(The API key from your WellnessLiving developer account)</span>
            </label>
            <input
              type="password"
              id="secretCode"
              name="secretCode"
              value={wlCredentials.secretCode}
              onChange={handleWlCredentialsChange}
              className={styles.input}
              placeholder="e.g., a1b2c3d4e5f6..."
            />
          </div>
          
          <h3>GoHighLevel Credentials</h3>
          <div className={styles.formGroup}>
            <label htmlFor="apiKey">API Key:</label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              value={ghlCredentials.apiKey}
              onChange={handleGhlCredentialsChange}
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="locationId">Location ID:</label>
            <input
              type="text"
              id="locationId"
              name="locationId"
              value={ghlCredentials.locationId}
              onChange={handleGhlCredentialsChange}
              className={styles.input}
            />
          </div>
          
          <button 
            onClick={handleTestConnection} 
            className={styles.button}
            disabled={connectionStatus.status === 'testing'}
          >
            {connectionStatus.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          
          <div className={`${styles.statusMessage} ${styles[connectionStatus.status]}`}>
            {connectionStatus.message}
          </div>
        </div>
      </section>
      
      <section className={styles.section}>
        <h2>Sync Settings</h2>
        <div className={styles.card}>
          <h3>Data to Sync</h3>
          <div className={styles.checkboxGroup}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="syncClients"
                name="syncClients"
                checked={syncSettings.syncClients}
                onChange={handleSyncSettingsChange}
              />
              <label htmlFor="syncClients">Clients/Contacts</label>
            </div>
            
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="syncAppointments"
                name="syncAppointments"
                checked={syncSettings.syncAppointments}
                onChange={handleSyncSettingsChange}
              />
              <label htmlFor="syncAppointments">Appointments</label>
            </div>
            
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="syncClasses"
                name="syncClasses"
                checked={syncSettings.syncClasses}
                onChange={handleSyncSettingsChange}
              />
              <label htmlFor="syncClasses">Classes</label>
            </div>
            
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="syncMemberships"
                name="syncMemberships"
                checked={syncSettings.syncMemberships}
                onChange={handleSyncSettingsChange}
              />
              <label htmlFor="syncMemberships">Memberships/Products</label>
            </div>
          </div>
          
          <h3>Sync Direction</h3>
          <div className={styles.radioGroup}>
            <div className={styles.radio}>
              <input
                type="radio"
                id="wlToGhl"
                name="syncDirection"
                value="wlToGhl"
                checked={syncSettings.syncDirection === 'wlToGhl'}
                onChange={handleSyncSettingsChange}
              />
              <label htmlFor="wlToGhl">WellnessLiving to GoHighLevel only</label>
            </div>
            
            <div className={styles.radio}>
              <input
                type="radio"
                id="ghlToWl"
                name="syncDirection"
                value="ghlToWl"
                checked={syncSettings.syncDirection === 'ghlToWl'}
                onChange={handleSyncSettingsChange}
              />
              <label htmlFor="ghlToWl">GoHighLevel to WellnessLiving only</label>
            </div>
            
            <div className={styles.radio}>
              <input
                type="radio"
                id="bidirectional"
                name="syncDirection"
                value="bidirectional"
                checked={syncSettings.syncDirection === 'bidirectional'}
                onChange={handleSyncSettingsChange}
              />
              <label htmlFor="bidirectional">Bidirectional</label>
            </div>
          </div>
          
          <h3>Sync Frequency</h3>
          <div className={styles.formGroup}>
            <select
              name="syncFrequency"
              value={syncSettings.syncFrequency}
              onChange={handleSyncSettingsChange}
              className={styles.select}
            >
              <option value="every15min">Every 15 minutes</option>
              <option value="every30min">Every 30 minutes</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="manual">Manual only</option>
            </select>
          </div>
          
          <div className={styles.buttonGroup}>
            <button onClick={handleSaveSettings} className={styles.button}>
              Save Settings
            </button>
            <button onClick={handleRunSync} className={`${styles.button} ${styles.secondaryButton}`}>
              Run Manual Sync Now
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Sync Status</h2>
        <div className={styles.card}>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Last Successful Sync:</span>
              <span className={styles.statusValue}>May 23, 2025 11:15 AM</span>
            </div>
            
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Records Synced:</span>
              <span className={styles.statusValue}>156 clients, 42 appointments</span>
            </div>
            
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Status:</span>
              <span className={`${styles.statusValue} ${styles.activeStatus}`}>Active</span>
            </div>
          </div>
          
          <div className={styles.buttonGroup}>
            <button 
              onClick={handleViewSyncHistory}
              className={`${styles.button} ${styles.secondaryButton}`}
              title="Coming in next version"
            >
              View Sync History
            </button>
            <button 
              onClick={handleViewErrorLogs}
              className={`${styles.button} ${styles.secondaryButton}`}
              title="Coming in next version"
            >
              View Error Logs
            </button>
          </div>
        </div>
      </section>
      
      <footer className={styles.footer}>
        <p>Powered by <span className={styles.brandName}>FlowOs</span> Integration Platform</p>
        <p className={styles.version}>Version 1.0.0 (MVP)</p>
      </footer>
    </div>
  );
}
