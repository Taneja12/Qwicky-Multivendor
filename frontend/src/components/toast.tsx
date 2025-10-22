'use client';

import * as ToastPrimitives from '@radix-ui/react-toast';

export function Toast({ title, description }: { title: string; description?: string }) {
  return (
    <ToastPrimitives.Provider>
      <ToastPrimitives.Root className="border p-4 rounded bg-white shadow">
        <ToastPrimitives.Title className="font-semibold">{title}</ToastPrimitives.Title>
        {description && <ToastPrimitives.Description>{description}</ToastPrimitives.Description>}
        <ToastPrimitives.Close className="mt-2 text-sm text-gray-500">Close</ToastPrimitives.Close>
      </ToastPrimitives.Root>
      <ToastPrimitives.Viewport className="fixed bottom-4 right-4 w-96 z-50" />
    </ToastPrimitives.Provider>
  );
}