import type { Meta, StoryObj } from '@storybook/react'

import LeaguePage from './LeaguePage'

const meta: Meta<typeof LeaguePage> = {
  component: LeaguePage,
}

export default meta

type Story = StoryObj<typeof LeaguePage>

export const Primary: Story = {}
