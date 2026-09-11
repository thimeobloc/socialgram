import { useEffect, useState } from "react";
import { getPostById } from "./postComment.api";
import type { PostDetail } from "./postDetail.schema";

type State<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not_found" }
  | { status: "success"; data: T };

export function usePostDetail(id: string) {
  const [state, setState] = useState<State<PostDetail>>({ status: "loading" });

  useEffect(() => {
    // Cancel the request if the component is unmounted or the ID changes
    const controller = new AbortController();
    setState({ status: "loading" });

    // Fetch the post details and update the state according to the result
    getPostById(id, controller.signal)
      .then((result) => {
        if (!result.ok) {
          if (result.error === "NOT_FOUND") {
            setState({ status: "not_found" });
          } else {
            setState({ status: "error", message: result.error });
          }
          return;
        }
        setState({ status: "success", data: result.data });
      })
      .catch((e) => {
        // Ignore errors caused by request cancellation
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({ status: "error", message: "Erreur inattendue" });
      });

    return () => controller.abort();
  }, [id]);

  return state;
}