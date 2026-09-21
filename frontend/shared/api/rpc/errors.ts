import { Code, ConnectError } from "@connectrpc/connect";

export function getRpcErrorMessage(error: unknown): string {
  const rpcError = ConnectError.from(error);
  switch (rpcError.code) {
    case Code.Unauthenticated:
      return "ログインが必要です。再度ログインしてください。";
    case Code.PermissionDenied:
      return "この操作を行う権限がありません。";
    case Code.Unimplemented:
      return "この機能は現在利用できません。時間をおいて再度お試しください。";
    case Code.Unavailable:
    case Code.DeadlineExceeded:
      return "サーバーに接続できませんでした。時間をおいて再度お試しください。";
    default:
      return "情報の取得または更新に失敗しました。再度お試しください。";
  }
}
