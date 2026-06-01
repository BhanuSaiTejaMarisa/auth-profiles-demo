import { useState } from 'react'
import { Box, CssBaseline, Tab, Tabs, ThemeProvider, Typography } from '@mui/material'
import './App.css'
import { appTheme } from './theme/appTheme'
import { SplitViewPage } from './pages/SplitViewPage'
import { ProfilesPage } from './pages/ProfilesPage'
import { MatrixPage } from './pages/MatrixPage'

type PageView = 'split' | 'profiles' | 'matrix'

function App() {
  const [page, setPage] = useState<PageView>('split')

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box className="workspace-shell">
        {/* Top bar: title + page navigation */}
        <Box className="workspace-topbar">
          <Box>
            <Typography variant="h4">Authorization Profiles Workspace</Typography>
            <Typography variant="body2" color="text.secondary">
              Use the tabs below to switch between views. PM and PO can compare each option independently.
            </Typography>
          </Box>
          <Tabs
            value={page}
            onChange={(_, v: PageView) => setPage(v)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Split View" value="split" />
            <Tab label="Auth Profiles" value="profiles" />
            <Tab label="Profile Matrix" value="matrix" />
          </Tabs>
        </Box>

        {/* Page content */}
        {page === 'split' && <SplitViewPage />}
        {page === 'profiles' && <ProfilesPage />}
        {page === 'matrix' && <MatrixPage />}
      </Box>
    </ThemeProvider>
  )
}

export default App
