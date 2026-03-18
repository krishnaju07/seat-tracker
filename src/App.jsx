import React, { useState } from 'react'
import ConfigPanel from './components/ConfigPanel'
import TrackerModal from './components/TrackerModal'
import { useEventTracker } from './hooks/useEventTracker'

// When _demoData is set, show it immediately without API calls
function TrackerView({ config, onClose }) {
  const { data, error, loading, lastUpdated, refresh } = useEventTracker(
    config._demoData ? null : config  // skip hook for demo
  )

  const displayData = config._demoData || data

  return (
    <TrackerModal
      data={displayData}
      error={error}
      loading={loading && !config._demoData}
      lastUpdated={lastUpdated || (config._demoData ? new Date() : null)}
      onRefresh={config._demoData ? () => {} : refresh}
      onClose={onClose}
      platform={config.platform}
      autoRefresh={config.autoRefresh && !config._demoData}
      intervalSec={config.intervalSec || 10}
      isDemo={!!config._demoData}
    />
  )
}

export default function App() {
  const [activeConfig, setActiveConfig] = useState(null)
  return (
    <>
      <ConfigPanel onStart={setActiveConfig} />
      {activeConfig && (
        <TrackerView config={activeConfig} onClose={() => setActiveConfig(null)} />
      )}
    </>
  )
}
