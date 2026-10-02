import { MaterialSymbol } from "@/shared/ui/material-symbol";

export function ApiInformation() {
  return (
    <div className="grow flex flex-col gap-y-4 p-4 rounded-xl text-tips-primary bg-tips-primary border-1 border-default-secondary">
      <div className="flex flex-row flex-nowrap gap-x-2 items-center">
        <MaterialSymbol
          name="lightbulb_2"
          className="select-none text-inherit font-inherit"
        />
        <h3 className="tx-body-strong text-inherit">APIについて</h3>
      </div>
      <div className="flex flex-col gap-y-3">
        <p>
          進捗部屋の情報は
          <a
            href="/api/rooms"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-note-primary text-balance underline hover:no-underline"
          >
            <code>/api/rooms</code>
            <MaterialSymbol name="open_in_new" className="text-sm!" />
          </a>
          から、イベントの情報は
          <a
            href="/api/events"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-note-primary text-balance underline hover:no-underline"
          >
            <code>/api/events</code>
            <MaterialSymbol name="open_in_new" className="text-sm!" />
          </a>
          から取得することができます。
        </p>
        <p>
          クエリパラメータ <code>since</code> と <code>until</code> に ISO8601
          形式の日時を指定して絞り込むことができます。
        </p>
      </div>
    </div>
  );
}
