"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  ModalCloseButton,
  ModalFooter,
  useToast,
} from "@/components/ui";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="mt-1 text-sm text-muted">
          Global UI components and layout are ready to use.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Primary, secondary, and outline variants</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button isLoading>Loading</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Form input with label and validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Email" placeholder="you@example.com" type="email" />
            <Input
              label="Password"
              type="password"
              error="Password is required"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modal</CardTitle>
            <CardDescription>Dialog overlay with actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted">Press Escape or click outside to close</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
            <CardDescription>Transient feedback messages</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Changes saved successfully")}
            >
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.error("Something went wrong")}
            >
              Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.warning("Please review your input")}
            >
              Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("New update available")}
            >
              Info
            </Button>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        description="This is a reusable modal component."
        size="md"
      >
        <p className="text-sm text-muted">
          Use modals for confirmations, forms, or any focused interaction.
        </p>
        <ModalFooter>
          <ModalCloseButton onClose={() => setIsModalOpen(false)} />
          <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
