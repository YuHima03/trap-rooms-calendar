import type { Metadata } from "next";
import { Vacancies } from "@/features/vacancies/components/vacancies";

export const metadata: Metadata = { title: "空き教室" };

export default function VacanciesPage() {
  return (
    <div className="flex flex-col gap-y-4">
      <h2>空き教室 (β版)</h2>
      <div className="grow flex flex-col gap-y-4 p-4 rounded-xl text-warning-primary bg-warning-primary border-1 border-default-secondary">
        <div className="flex flex-col gap-y-3">
          最新の情報と異なる場合があります。
          部屋の利用前には必ず大学ウェブサイトをご確認ください。
        </div>
      </div>
      <Vacancies />
    </div>
  );
}
