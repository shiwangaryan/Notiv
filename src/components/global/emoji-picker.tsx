'use client';
import React from 'react';
import dynamic from "next/dynamic";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface EmojiPickerProps {
  children: React.ReactNode;
  getValue?: (emoji: string) => void;
}
const EmojiPicker: React.FC<EmojiPickerProps> = ({ children, getValue }) => {
  const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });
  const onClick = (selectedEmoji: { emoji: string }) => {
    if (getValue) getValue(selectedEmoji.emoji);
  };

  return (
    <div className="flex items-center">
      <Popover>
        <PopoverTrigger className="cursor-pointer">{children}</PopoverTrigger>
        <PopoverContent
          className="p-0
                border-none"
        >
          <Picker onEmojiClick={onClick} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmojiPicker;
