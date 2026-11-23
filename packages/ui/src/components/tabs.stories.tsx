import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { IconButton } from './icon-button';
import { Tabs, TabsList, TabsTrigger } from './tabs';

export default { title: 'Components / Tabs' } satisfies Meta;

const LevelTabsDemo = () => (
  <Tabs defaultValue="0">
    <div className="flex items-end gap-1 border-b">
      <TabsList aria-label="Level tabs">
        <TabsTrigger value="0">Level 0</TabsTrigger>
        <TabsTrigger value="1">Level 1</TabsTrigger>
        <TabsTrigger value="2">Attic, converted into two bedrooms</TabsTrigger>
        <TabsTrigger value="3" disabled>
          Basement
        </TabsTrigger>
      </TabsList>
      <IconButton label="Add level" icon={<Plus />} size="sm" />
    </div>
  </Tabs>
);

export const LevelTabs: StoryObj = { render: () => <LevelTabsDemo /> };
