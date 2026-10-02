import { Schedule } from "@/features/schedule/components/schedule";

export default function HomePage() {
  return (
    <>
      <div className="flex flex-col gap-y-4">
        <h2>今後の進捗部屋</h2>
      </div>
      <Schedule />
    </>
  );
}
