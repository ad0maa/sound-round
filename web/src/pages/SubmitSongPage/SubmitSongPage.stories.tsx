import type { Meta, StoryObj } from '@storybook/react'

import SubmitSongPage from './SubmitSongPage'

const meta: Meta<typeof SubmitSongPage> = {
  component: SubmitSongPage,
}

export default meta

type Story = StoryObj<typeof SubmitSongPage>

export const Primary: Story = {}
