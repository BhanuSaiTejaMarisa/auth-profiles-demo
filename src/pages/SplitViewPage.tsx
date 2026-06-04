import { useState } from 'react'
import { Box, Chip } from '@mui/material'
import { ProfilesPage } from './ProfilesPage'
import { MatrixPage } from './MatrixPage'

export function SplitViewPage() {
  const [selectedProfileCodes, setSelectedProfileCodes] = useState<string[]>([])

  return (
    <>
      <Box className="workspace-chipbar" sx={{ mb: 1.5 }}>
        <Chip
          size="small"
          label={`Selected Profiles: ${selectedProfileCodes.length}`}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Box className="split-layout">
        <ProfilesPage
          selectedProfileCodes={selectedProfileCodes}
          onSelectedProfileCodesChange={setSelectedProfileCodes}
        />
        <MatrixPage
          externalSelectedProfileCodes={selectedProfileCodes}
          profileCodesReadOnly
        />
      </Box>
    </>
  )
}
