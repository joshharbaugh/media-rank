import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';

interface UISelectProps {
  label: string,
  name: string,
  value: string,
  items: {
    label: string,
    value: string
  }[],
  onValueChange: (value: string) => void
}

function UISelect({ label, name, onValueChange, value, items }: UISelectProps) {
  return (
    <Select.Root
      name={name}
      onValueChange={onValueChange}
      value={value}
    >
      <Select.Trigger
        className="flex justify-between items-center min-w-[150px] px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-indigo-500"
        aria-label={label}
      >
        <Select.Value placeholder="Select a value…" />
        <Select.Icon className="text-gray-500 dark:text-gray-400">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          <Select.Viewport className="p-[5px]">
            {items && items.map((item, idx) => (
              <Select.Item
                key={idx}
                value={item.value}
                className="relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-sm font-medium leading-none outline-none hover:bg-gray-300 dark:hover:bg-gray-800"
              >
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default UISelect;
