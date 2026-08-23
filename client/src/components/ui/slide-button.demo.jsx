import { SlideButton } from '@/components/ui/slide-button';

export default function SlideButtonDemo() {
  return (
    <div className="flex justify-center p-4" style={{ maxWidth: 320 }}>
      <SlideButton
        label="Slide to confirm"
        successLabel="Done"
        errorLabel="Failed"
        onConfirm={() => new Promise((resolve) => setTimeout(resolve, 1200))}
      />
    </div>
  );
}
