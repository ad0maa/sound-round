import type { Meta, StoryObj } from '@storybook/react'

import LoaderPreviewPage from './LoaderPreviewPage'

const meta: Meta<typeof LoaderPreviewPage> = {
  component: LoaderPreviewPage,
}

export default meta

type Story = StoryObj<typeof LoaderPreviewPage>

export const Primary: Story = {}
