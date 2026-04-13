import { PageHeader } from '@/components/layout/PageHeader';
import { GardenPlantForm } from '@/components/garden/GardenPlantForm';

export default function NeuePflanzePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Neue Pflanze" subtitle="Pflanze zum Inventar hinzufügen" />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
        <GardenPlantForm />
      </div>
    </div>
  );
}
