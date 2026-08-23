import NeuralBackground from '@/components/ui/flow-field-background';

const settings = {
  trailOpacity: 0.1,
  speed: 0.8,
};

export default function NeuralHeroDemo(props) {
  const s = { ...settings, ...props };
  return (
    <div className="h-screen w-screen">
      <NeuralBackground
        color="#818cf8"
        trailOpacity={s.trailOpacity}
        speed={s.speed}
      />
    </div>
  );
}
