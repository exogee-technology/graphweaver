import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Badge } from "./component";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "greyscale"],
    },
    children: { control: "text" },
    className: { control: "text" },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} as Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Badge",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Badge",
  },
};

export const Greyscale: Story = {
  args: {
    variant: "greyscale",
    children: "Greyscale Badge",
  },
};

export const WithIconPrefix: Story = {
  args: {
    variant: "primary",
    children: "Badge with icon",
    iconPrefix: "🏷️",
  },
};

export const WithIconSuffix: Story = {
  args: {
    variant: "secondary",
    children: "Badge with icon",
    iconSuffix: "✨",
  },
};

export const WithBothIcons: Story = {
  args: {
    variant: "primary",
    children: "Full Badge",
    iconPrefix: "🎯",
    iconSuffix: "🚀",
  },
};

export const Clickable: Story = {
  args: {
    variant: "primary",
    children: "Click me!",
    onClick: fn(),
  },
};
